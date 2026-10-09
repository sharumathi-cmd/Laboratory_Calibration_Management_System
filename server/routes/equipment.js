const r = require('express').Router(), db = require('../config/db'), { role } = require('../middleware/auth'), { audit } = require('../utils/helpers');
const STUDENT = 'id,code,name,manufacturer,model,department,location,operational_status,last_calibration_date,next_calibration_date,compliance_status,measurement_range,accuracy';
const FIELDS = ['name', 'manufacturer', 'model', 'serial_number', 'department', 'location', 'purchase_date', 'installation_date', 'calibration_frequency_days', 'measurement_range', 'accuracy', 'resolution', 'maintenance_interval_days', 'warranty_until', 'usage_hours', 'operational_status'];
const clean = b => FIELDS.reduce((o, k) => (b[k] === undefined || b[k] === '' ? o : { ...o, [k]: b[k] }), {});
const cols = u => (u.role === 'student' ? STUDENT : '*');
r.get('/', async (q, s) => s.json((await db.query(`SELECT ${cols(q.user)} FROM equipment ORDER BY code`))[0]));
r.get('/:id', async (q, s) => { const [[e]] = await db.query(`SELECT ${cols(q.user)} FROM equipment WHERE id=?`, [q.params.id]); e ? s.json(e) : s.status(404).json({ message: 'Equipment not found.' }); });
r.post('/', role('administrator', 'technician'), async (q, s) => {
  const d = clean(q.body); if (!d.name || !d.serial_number) return s.status(400).json({ message: 'Name and serial number are required.' });
  const [dup] = await db.query('SELECT id FROM equipment WHERE serial_number=?', [d.serial_number]);
  if (dup.length) return s.status(409).json({ message: 'This serial number is already registered.' });
  const [[c]] = await db.query('SELECT COUNT(*) n FROM equipment'); const code = 'EQ-' + String(c.n + 1).padStart(4, '0');
  const k = Object.keys(d); const [ins] = await db.query(`INSERT INTO equipment (code,created_by,${k.join(',')}) VALUES (?,?,${k.map(() => '?').join(',')})`, [code, q.user.id, ...k.map(x => d[x])]);
  await audit(q.user.id, 'CREATE_EQUIPMENT', 'equipment', ins.insertId, code); s.status(201).json({ id: ins.insertId, code });
});
r.put('/:id', role('administrator', 'technician'), async (q, s) => {
  const d = clean(q.body), k = Object.keys(d); if (!k.length) return s.status(400).json({ message: 'Nothing to update.' });
  await db.query(`UPDATE equipment SET ${k.map(x => x + '=?').join(',')} WHERE id=?`, [...k.map(x => d[x]), q.params.id]);
  await audit(q.user.id, 'UPDATE_EQUIPMENT', 'equipment', q.params.id, k.join(',')); s.json({ message: 'Equipment updated.' });
});
r.get('/:id/timeline', async (q, s) => {
  const staff = q.user.role !== 'student';
  const [cal] = await db.query(`SELECT id, calibration_date date, cri, band, decision${staff ? ', certificate_no' : ''} FROM calibrations WHERE equipment_id=? ORDER BY calibration_date DESC`, [q.params.id]);
  const [m] = staff ? await db.query('SELECT date,type,description FROM maintenance WHERE equipment_id=?', [q.params.id]) : [[]];
  const items = [...cal.map(c => ({ kind: 'calibration', ...c })), ...m.map(x => ({ kind: 'maintenance', ...x }))].sort((a, b) => (a.date < b.date ? 1 : -1));
  s.json(items);
});
r.get('/:id/dcf', role('administrator', 'technician', 'auditor'), async (q, s) => s.json((await db.query('SELECT * FROM dcf_profiles WHERE equipment_id=?', [q.params.id]))[0][0] || { n: 0 }));
module.exports = r;
