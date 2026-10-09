const cron = require('node-cron'), db = require('../config/db'), { statusFor } = require('../utils/helpers');
const MILESTONES = [30, 15, 7, 1];
async function runCompliance() {
  const [eq] = await db.query('SELECT id,code,name,next_calibration_date n FROM equipment WHERE operational_status<>"retired"');
  const today = new Date().toISOString().slice(0, 10);
  for (const e of eq) {
    await db.query('UPDATE equipment SET compliance_status=? WHERE id=?', [statusFor(e.n), e.id]);
    if (!e.n) continue;
    const d = Math.floor((new Date(e.n) - new Date(today)) / 86400000); let key, type, msg;
    if (d < 0) { key = `exp:${e.id}:${today}`; type = 'Expired'; msg = `${e.code} ${e.name} calibration expired ${-d} day(s) ago.`; }
    else if (MILESTONES.includes(d)) { key = `due:${e.id}:${e.n}:${d}`; type = 'Due Soon'; msg = `${e.code} ${e.name} is due for calibration in ${d} day(s).`; }
    if (key) await db.query('INSERT IGNORE INTO alerts (equipment_id,type,message,dedupe_key) VALUES (?,?,?,?)', [e.id, type, msg, key]); // unique key avoids duplicates
  }
  console.log('[scheduler] compliance check done for', eq.length, 'equipment');
}
module.exports = { start: () => { cron.schedule('0 6 * * *', () => runCompliance().catch(console.error)); runCompliance().catch(console.error); }, runCompliance };
