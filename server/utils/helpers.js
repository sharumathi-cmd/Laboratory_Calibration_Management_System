const db = require('../config/db'); const { buildDcf } = require('../engine/dcf');
const DUE = () => parseInt(process.env.DUE_SOON_DAYS || '30', 10);
const audit = (userId, action, entity, entityId, detail = '') =>
  db.query('INSERT INTO audit_logs (user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?)', [userId, action, entity, entityId, String(detail).slice(0, 400)]);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const statusFor = next => { if (!next) return 'Expired'; const d = Math.floor((new Date(next) - new Date(new Date().toISOString().slice(0, 10))) / 86400000); return d < 0 ? 'Expired' : d <= DUE() ? 'Due Soon' : 'Calibrated'; };
async function refreshCompliance(eqId) {
  const [[e]] = await db.query('SELECT next_calibration_date n FROM equipment WHERE id=?', [eqId]);
  await db.query('UPDATE equipment SET compliance_status=? WHERE id=?', [statusFor(e && e.n), eqId]);
}
async function rebuildDcf(eqId) {
  const [rows] = await db.query("SELECT calibration_date date, max_dev_pct maxDevPct FROM calibrations WHERE equipment_id=? AND decision='accepted'", [eqId]);
  const d = buildDcf(rows);
  await db.query(`REPLACE INTO dcf_profiles (equipment_id,n,mean_dev,std_dev,drift_slope,mean_interval,std_interval) VALUES (?,?,?,?,?,?,?)`,
    [eqId, d.n, d.meanDev, d.stdDev, d.driftSlope, d.meanInterval, d.stdInterval]);
  return d;
}
async function acceptOnEquipment(cal) {
  await db.query('UPDATE equipment SET last_calibration_date=?, next_calibration_date=? WHERE id=?', [cal.calibration_date, cal.next_date, cal.equipment_id]);
  await rebuildDcf(cal.equipment_id); await refreshCompliance(cal.equipment_id);
}
module.exports = { audit, addDays, statusFor, refreshCompliance, rebuildDcf, acceptOnEquipment };
