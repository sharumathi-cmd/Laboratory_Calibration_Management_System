// CRVE: 7 explainable checks -> CRI. Pure functions, no database access.
const W = require('../config/criWeights');
const DAY = 86400000;
const days = (a, b) => Math.round((new Date(a) - new Date(b)) / DAY);
const status = s => (s >= 75 ? 'Passed' : s >= 40 ? 'Warning' : 'Failed');
const mk = (no, name, key, score, reason) => ({ no, name, weight: W[key], score, status: status(score), reason });

function historical(dcf, devPct) {
  if (dcf.n < 3) return mk(1, 'Historical behaviour', 'historical', 70, `Only ${dcf.n} earlier accepted record(s): fingerprint is still learning, neutral score.`);
  const z = Math.abs(devPct - dcf.meanDev) / Math.max(dcf.stdDev, 1), s = z <= 1 ? 100 : z <= 2 ? 75 : z <= 3 ? 40 : 10;
  return mk(1, 'Historical behaviour', 'historical', s, `Max deviation ${devPct.toFixed(1)}% of tolerance vs usual ${dcf.meanDev.toFixed(1)}% (z = ${z.toFixed(2)}).`);
}
function deviation(devPct) {
  const r = devPct / 100, s = r <= 0.5 ? 100 : r <= 0.8 ? 80 : r <= 1 ? 50 : 0;
  return mk(2, 'Abnormal deviation / tolerance', 'deviation', s, `Largest deviation uses ${devPct.toFixed(1)}% of the allowed tolerance.`);
}
function interval(cal, eq, lastDate) {
  if (!lastDate) return mk(3, 'Calibration interval', 'interval', 100, 'First calibration on record: no interval to compare.');
  const actual = days(cal.date, lastDate), f = eq.frequency, off = Math.abs(actual - f) / f;
  const s = off <= 0.1 ? 100 : off <= 0.25 ? 70 : off <= 0.5 ? 40 : 10;
  return mk(3, 'Calibration interval', 'interval', s, `${actual} days since last calibration vs ${f} planned (${(off * 100).toFixed(0)}% ${actual > f ? 'late' : 'early'}).`);
}
function maintenance(cal, eq, maint, dcf, devPct) {
  const big = dcf.n >= 1 && Math.abs(devPct - dcf.meanDev) > Math.max(dcf.stdDev, 5);
  const recent = maint.some(m => { const d = days(cal.date, m.date); return d >= 0 && d <= 30; });
  const last = maint.length ? maint.map(m => m.date).sort().pop() : null;
  const overdue = eq.maintenanceInterval && (!last || days(cal.date, last) > eq.maintenanceInterval);
  if (big && recent) return mk(4, 'Maintenance consistency', 'maintenance', 90, 'Large change is explained by a recent repair or part replacement.');
  if (big) return mk(4, 'Maintenance consistency', 'maintenance', 40, 'Large change with no maintenance on record before this calibration.');
  if (overdue) return mk(4, 'Maintenance consistency', 'maintenance', 60, 'Scheduled maintenance is overdue.');
  return mk(4, 'Maintenance consistency', 'maintenance', 100, 'No unexplained change and maintenance is up to date.');
}
function usage(eq, devPct) {
  const heavy = eq.usageHours >= 1000, idle = eq.usageHours < 50;
  if (heavy && devPct < 10) return mk(5, 'Equipment usage', 'usage', 50, `${eq.usageHours} usage hours but almost no drift: unusual.`);
  if (idle && devPct >= 50) return mk(5, 'Equipment usage', 'usage', 30, `Only ${eq.usageHours} usage hours but large drift: unusual.`);
  return mk(5, 'Equipment usage', 'usage', 100, `Drift is consistent with ${eq.usageHours} usage hours.`);
}
function certificate(cal, eq) {
  const bad = [];
  if (!/^[A-Z0-9][A-Z0-9\-\/]{5,}$/i.test(cal.certificateNo || '')) bad.push('certificate number format');
  if (cal.certificateDuplicate) bad.push('certificate number already used');
  if (cal.certificateDate !== cal.date) bad.push('certificate date differs from calibration date');
  if ((cal.certificateSerial || '').trim().toLowerCase() !== (eq.serial || '').trim().toLowerCase()) bad.push('serial number does not match equipment');
  if (!cal.hasFile) bad.push('no certificate file attached');
  return mk(6, 'Certificate verification', 'certificate', Math.round(100 * (5 - bad.length) / 5), bad.length ? 'Problems: ' + bad.join('; ') + '.' : 'All 5 certificate checks passed.');
}
function technician(t) {
  if (!t || t.othersCount < 3) return mk(7, 'Technician pattern', 'technician', 80, 'Not enough records from other technicians to compare.');
  const dDiff = Math.abs(t.avgDev - t.othersAvgDev) / Math.max(t.othersAvgDev, 5), rDiff = Math.abs(t.reviewShare - t.othersReviewShare);
  const s = dDiff > 1 || rDiff > 0.4 ? 30 : dDiff > 0.5 || rDiff > 0.25 ? 60 : 100;
  return mk(7, 'Technician pattern', 'technician', s, `Avg deviation ${t.avgDev.toFixed(1)}% (others ${t.othersAvgDev.toFixed(1)}%); sent to review ${(t.reviewShare * 100).toFixed(0)}% (others ${(t.othersReviewShare * 100).toFixed(0)}%).`);
}
// ctx: { cal, eq, devPct, dcf, lastDate, maint, tech }
function evaluate(ctx) {
  const { cal, eq, devPct, dcf } = ctx;
  const checks = [historical(dcf, devPct), deviation(devPct), interval(cal, eq, ctx.lastDate), maintenance(cal, eq, ctx.maint || [], dcf, devPct),
    usage(eq, devPct), certificate(cal, eq), technician(ctx.tech)];
  let cri = Math.round(checks.reduce((s, c) => s + c.weight * c.score, 0) / 100);
  const outOfTolerance = cal.points.some(p => !p.within);
  if (outOfTolerance) cri = Math.min(cri, 49);
  return { checks, cri, outOfTolerance };
}
module.exports = { evaluate, status };
