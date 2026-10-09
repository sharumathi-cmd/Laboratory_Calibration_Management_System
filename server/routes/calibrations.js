const r = require('express').Router(), db = require('../config/db'), upload = require('../middleware/upload');
const { role } = require('../middleware/auth'), { audit, addDays, acceptOnEquipment } = require('../utils/helpers');
const { buildDcf } = require('../engine/dcf'), { evaluate } = require('../engine/crve'), { decide } = require('../engine/decision');
r.get('/', async (q, s) => {
  const st = q.user.role === 'student';
  const [rows] = await db.query(`SELECT c.id, c.equipment_id, e.code, e.name equipment_name, c.calibration_date, c.band, c.decision ${st ? '' : ', c.cri, c.certificate_no, u.name technician'}
    FROM calibrations c JOIN equipment e ON e.id=c.equipment_id JOIN users u ON u.id=c.technician_id ${q.query.equipment_id ? 'WHERE c.equipment_id=' + db.escape(+q.query.equipment_id) : ''} ORDER BY c.calibration_date DESC, c.id DESC`);
  s.json(rows);
});
r.get('/:id', async (q, s) => {
  const [[c]] = await db.query('SELECT c.*, e.code, e.name equipment_name, u.name technician, rv.name reviewer FROM calibrations c JOIN equipment e ON e.id=c.equipment_id JOIN users u ON u.id=c.technician_id LEFT JOIN users rv ON rv.id=c.reviewed_by WHERE c.id=?', [q.params.id]);
  if (!c) return s.status(404).json({ message: 'Calibration not found.' });
  if (q.user.role === 'student') return s.json({ id: c.id, code: c.code, equipment_name: c.equipment_name, calibration_date: c.calibration_date, band: c.band, decision: c.decision });
  const [points] = await db.query('SELECT * FROM calibration_test_points WHERE calibration_id=?', [c.id]);
  const [checks] = await db.query('SELECT * FROM calibration_checks WHERE calibration_id=? ORDER BY check_no', [c.id]);
  s.json({ ...c, points, checks });
});
r.post('/', role('administrator', 'technician'), (q, s, n) => upload.single('certificate')(q, s, e => (e ? s.status(400).json({ message: e.message }) : n())), async (q, s) => {
  const b = q.body; let points; try { points = JSON.parse(b.points || '[]'); } catch { points = []; }
  const tol = parseFloat(b.tolerance);
  if (!b.equipment_id || !b.calibration_date || !b.certificate_no || !(tol > 0) || !points.length) return s.status(400).json({ message: 'Equipment, date, certificate number, tolerance and at least one test point are required.' });
  const [[e]] = await db.query('SELECT * FROM equipment WHERE id=?', [b.equipment_id]); if (!e) return s.status(404).json({ message: 'Equipment not found.' });
  const pts = points.map(p => { const dev = +p.measured - +p.standard; return { standard: +p.standard, measured: +p.measured, dev, within: Math.abs(dev) <= tol }; });
  const devPct = Math.max(...pts.map(p => Math.abs(p.dev))) / tol * 100;
  const [hist] = await db.query("SELECT calibration_date date, max_dev_pct maxDevPct FROM calibrations WHERE equipment_id=? AND decision='accepted'", [e.id]);
  const [maint] = await db.query('SELECT date FROM maintenance WHERE equipment_id=?', [e.id]);
  const [[dup]] = await db.query('SELECT COUNT(*) n FROM calibrations WHERE certificate_no=?', [b.certificate_no]);
  const [[me]] = await db.query("SELECT COUNT(*) n, AVG(max_dev_pct) a, AVG(decision IN ('pending_review','quarantined')) rs FROM calibrations WHERE technician_id=?", [q.user.id]);
  const [[ot]] = await db.query("SELECT COUNT(*) n, AVG(max_dev_pct) a, AVG(decision IN ('pending_review','quarantined')) rs FROM calibrations WHERE technician_id<>?", [q.user.id]);
  const tech = me.n >= 3 && ot.n >= 3 ? { avgDev: +me.a, reviewShare: +me.rs, othersAvgDev: +ot.a, othersReviewShare: +ot.rs, othersCount: ot.n } : null;
  const dcf = buildDcf(hist);
  const res = evaluate({ cal: { date: b.calibration_date, certificateNo: b.certificate_no, certificateDate: b.certificate_date || b.calibration_date, certificateSerial: b.certificate_serial || '', certificateDuplicate: dup.n > 0, hasFile: !!q.file, points: pts },
    eq: { serial: e.serial_number, frequency: e.calibration_frequency_days, maintenanceInterval: e.maintenance_interval_days, usageHours: e.usage_hours }, devPct, dcf, lastDate: e.last_calibration_date, maint, tech });
  const d = decide(res.cri, res.checks, dcf.n < 3), next = b.next_date || addDays(b.calibration_date, e.calibration_frequency_days);
  const [ins] = await db.query(`INSERT INTO calibrations (equipment_id,lab,agency,technician_id,certificate_no,certificate_file,calibration_date,tolerance,remarks,next_date,max_dev_pct,cri,band,decision) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [e.id, b.lab || null, b.agency || null, q.user.id, b.certificate_no, q.file ? q.file.filename : null, b.calibration_date, tol, b.remarks || null, next, devPct, res.cri, d.band, d.decision]);
  const id = ins.insertId;
  for (const p of pts) await db.query('INSERT INTO calibration_test_points (calibration_id,standard_value,measured_value,deviation,tolerance,within_tolerance) VALUES (?,?,?,?,?,?)', [id, p.standard, p.measured, p.dev, tol, p.within]);
  for (const c of res.checks) await db.query('INSERT INTO calibration_checks (calibration_id,check_no,name,weight,score,status,reason) VALUES (?,?,?,?,?,?,?)', [id, c.no, c.name, c.weight, c.score, c.status, c.reason]);
  if (d.decision === 'accepted') await acceptOnEquipment({ equipment_id: e.id, calibration_date: b.calibration_date, next_date: next });
  await audit(q.user.id, 'ADD_CALIBRATION', 'calibration', id, `${e.code} CRI ${res.cri} -> ${d.decision}`);
  s.status(201).json({ id, cri: res.cri, band: d.band, decision: d.decision, checks: res.checks });
});
module.exports = r;
