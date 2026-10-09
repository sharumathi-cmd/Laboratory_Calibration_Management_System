const r = require('express').Router(), db = require('../config/db'), { role } = require('../middleware/auth'), { audit } = require('../utils/helpers');
r.use(role('administrator'));
r.get('/', async (q, s) => s.json((await db.query('SELECT id,name,email,id_number,department,role,status,created_at FROM users ORDER BY status="pending" DESC, created_at DESC'))[0]));
r.patch('/:id/approve', async (q, s) => {
  const nr = q.body.role; if (nr && !['administrator', 'technician', 'auditor', 'student'].includes(nr)) return s.status(400).json({ message: 'Unknown role.' });
  await db.query("UPDATE users SET status='active', role=COALESCE(?,role) WHERE id=?", [nr || null, q.params.id]);
  await audit(q.user.id, 'APPROVE_USER', 'user', q.params.id, nr || ''); s.json({ message: 'User approved.' });
});
r.patch('/:id/role', async (q, s) => {
  if (!['administrator', 'technician', 'auditor', 'student'].includes(q.body.role)) return s.status(400).json({ message: 'Unknown role.' });
  await db.query('UPDATE users SET role=? WHERE id=?', [q.body.role, q.params.id]); await audit(q.user.id, 'CHANGE_ROLE', 'user', q.params.id, q.body.role); s.json({ message: 'Role updated.' });
});
r.patch('/:id/disable', async (q, s) => {
  if (+q.params.id === q.user.id) return s.status(400).json({ message: 'You cannot disable your own account.' });
  await db.query("UPDATE users SET status='disabled' WHERE id=?", [q.params.id]); await audit(q.user.id, 'DISABLE_USER', 'user', q.params.id); s.json({ message: 'User disabled.' });
});
module.exports = r;
