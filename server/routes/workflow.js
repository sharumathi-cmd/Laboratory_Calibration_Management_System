const r = require('express').Router(), db = require('../config/db'), { role } = require('../middleware/auth');
const { audit, acceptOnEquipment, statusFor } = require('../utils/helpers');
const staff = role('administrator', 'technician'), watch = role('administrator', 'technician', 'auditor');
// ---- Review & quarantine: same engine, different source state ----
const queue = state => async (q, s) => s.json((await db.query(`SELECT c.id,c.calibration_date,c.cri,c.band,c.certificate_no,c.technician_id,e.code,e.name equipment_name,u.name technician FROM calibrations c JOIN equipment e ON e.id=c.equipment_id JOIN users u ON u.id=c.technician_id WHERE c.decision=? ORDER BY c.created_at`, [state]))[0]);
const resolve = (from, to) => async (q, s) => {
  const note = (q.body.note || '').trim(); if (!note) return s.status(400).json({ message: 'A written note is required.' });
  const [[c]] = await db.query('SELECT * FROM calibrations WHERE id=?', [q.params.id]);
  if (!c || c.decision !== from) return s.status(404).json({ message: 'No record waiting in this queue.' });
  if (c.technician_id === q.user.id) return s.status(403).json({ message: 'You entered this calibration, so you cannot review or release it.' }); // notOwnRecord rule
  await db.query('UPDATE calibrations SET decision=?, reviewed_by=?, review_note=?, reviewed_at=NOW() WHERE id=?', [to, q.user.id, note, c.id]);
  if (to === 'accepted') await acceptOnEquipment(c);
  await audit(q.user.id, `${from === 'pending_review' ? 'REVIEW' : 'QUARANTINE'}_${to.toUpperCase()}`, 'calibration', c.id, note); s.json({ message: `Calibration ${to}.` });
};
r.get('/review', staff, queue('pending_review')); r.post('/review/:id/approve', staff, resolve('pending_review', 'accepted')); r.post('/review/:id/reject', staff, resolve('pending_review', 'rejected'));
r.get('/quarantine', watch, queue('quarantined')); r.post('/quarantine/:id/release', staff, resolve('quarantined', 'accepted')); r.post('/quarantine/:id/reject', staff, resolve('quarantined', 'rejected'));
// ---- Maintenance ----
r.get('/maintenance', watch, async (q, s) => s.json((await db.query('SELECT m.*, e.code, e.name equipment_name, u.name performed_by_name FROM maintenance m JOIN equipment e ON e.id=m.equipment_id LEFT JOIN users u ON u.id=m.performed_by ORDER BY m.date DESC'))[0]));
r.post('/maintenance', staff, async (q, s) => {
  const b = q.body; if (!b.equipment_id || !b.date || !b.type) return s.status(400).json({ message: 'Equipment, date and type are required.' });
  const [i] = await db.query('INSERT INTO maintenance (equipment_id,date,type,description,parts_replaced,performed_by) VALUES (?,?,?,?,?,?)', [b.equipment_id, b.date, b.type, b.description || null, b.parts_replaced || null, q.user.id]);
  await audit(q.user.id, 'ADD_MAINTENANCE', 'equipment', b.equipment_id, b.type); s.status(201).json({ id: i.insertId });
});
// ---- Compliance, alerts, dashboard ----
r.get('/compliance/summary', async (q, s) => {
  const [list] = await db.query('SELECT id,code,name,department,next_calibration_date,compliance_status FROM equipment ORDER BY next_calibration_date IS NULL DESC, next_calibration_date');
  const rows = list.map(e => ({ ...e, compliance_status: statusFor(e.next_calibration_date), days: e.next_calibration_date ? Math.floor((new Date(e.next_calibration_date) - new Date(new Date().toISOString().slice(0, 10))) / 86400000) : null }));
  const count = k => rows.filter(e => e.compliance_status === k).length;
  s.json({ total: rows.length, calibrated: count('Calibrated'), dueSoon: count('Due Soon'), expired: count('Expired'), equipment: rows });
});
r.get('/alerts', watch, async (q, s) => s.json((await db.query('SELECT a.*, EXISTS(SELECT 1 FROM alert_reads r WHERE r.alert_id=a.id AND r.user_id=?) is_read FROM alerts a ORDER BY a.created_at DESC LIMIT 200', [q.user.id]))[0]));
r.patch('/alerts/:id/read', watch, async (q, s) => { await db.query('INSERT IGNORE INTO alert_reads (alert_id,user_id) VALUES (?,?)', [q.params.id, q.user.id]); s.json({ ok: true }); });
r.get('/dashboard/summary', async (q, s) => {
  const [[eq]] = await db.query("SELECT COUNT(*) total, SUM(compliance_status='Calibrated') calibrated, SUM(compliance_status='Due Soon') dueSoon, SUM(compliance_status='Expired') expired FROM equipment");
  const out = { equipment: eq, role: q.user.role };
  if (q.user.role === 'student') return s.json(out);
  const [[p]] = await db.query("SELECT SUM(decision='pending_review') pending, SUM(decision='quarantined') quarantined FROM calibrations");
  out.queues = p; out.recent = (await db.query('SELECT c.id,e.code,c.calibration_date,c.cri,c.band,c.decision FROM calibrations c JOIN equipment e ON e.id=c.equipment_id ORDER BY c.id DESC LIMIT 6'))[0];
  out.trend = (await db.query("SELECT DATE_FORMAT(calibration_date,'%Y-%m') month, ROUND(AVG(cri)) avg_cri FROM calibrations GROUP BY month ORDER BY month DESC LIMIT 6"))[0].reverse();
  if (q.user.role === 'administrator') out.pendingUsers = (await db.query("SELECT COUNT(*) n FROM users WHERE status='pending'"))[0][0].n;
  s.json(out);
});
// ---- Audit trail & technician activity ----
const audRole = role('administrator', 'auditor');
r.get('/audit', audRole, async (q, s) => {
  const w = [], a = []; if (q.query.action) { w.push('l.action=?'); a.push(q.query.action); } if (q.query.user) { w.push('u.name LIKE ?'); a.push(`%${q.query.user}%`); }
  s.json((await db.query(`SELECT l.*, u.name user_name FROM audit_logs l LEFT JOIN users u ON u.id=l.user_id ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY l.id DESC LIMIT 300`, a))[0]);
});
r.get('/activity', audRole, async (q, s) => s.json((await db.query(`SELECT u.id,u.name,u.department, COUNT(c.id) calibrations, ROUND(AVG(c.cri)) avg_cri, SUM(c.decision IN ('pending_review','quarantined')) flagged, MAX(c.created_at) last_entry FROM users u LEFT JOIN calibrations c ON c.technician_id=u.id WHERE u.role IN ('technician','administrator') GROUP BY u.id`))[0]));
module.exports = r;
