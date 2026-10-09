// Dynamic Calibration Fingerprint: statistics of earlier ACCEPTED calibrations of one equipment.
const DAY = 86400000;
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const std = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
// history: [{ date:'YYYY-MM-DD', maxDevPct:number }]
function buildDcf(history) {
  const h = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const n = h.length;
  if (!n) return { n: 0, meanDev: 0, stdDev: 0, driftSlope: 0, meanInterval: 0, stdInterval: 0 };
  const t = h.map(x => new Date(x.date).getTime() / DAY), y = h.map(x => x.maxDevPct);
  let slope = 0;
  if (n >= 2) { const mt = mean(t), my = mean(y); const den = t.reduce((s, x) => s + (x - mt) ** 2, 0);
    slope = den ? t.reduce((s, x, i) => s + (x - mt) * (y[i] - my), 0) / den : 0; }
  const intervals = t.slice(1).map((x, i) => x - t[i]);
  return { n, meanDev: mean(y), stdDev: std(y), driftSlope: slope,
    meanInterval: intervals.length ? mean(intervals) : 0, stdInterval: std(intervals) };
}
module.exports = { buildDcf, mean, std };
