const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), db = require('../config/db');
const { auth } = require('../middleware/auth'), { audit } = require('../utils/helpers');
const strong = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(p || '');
const cookie = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 3600 * 1000 };
r.post('/signup', async (req, res) => {
  const { name, email, id_number, department, role, password, confirm } = req.body;
  if (![name, email, id_number, department].every(Boolean)) return res.status(400).json({ message: 'Fill in all fields.' });
  if (!['technician', 'auditor', 'student'].includes(role)) return res.status(400).json({ message: 'Choose Laboratory Technician, Auditor or Student.' });
  if (!strong(password)) return res.status(400).json({ message: 'Password needs 8+ characters with upper case, lower case and a digit.' });
  if (password !== confirm) return res.status(400).json({ message: 'Passwords do not match.' });
  const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
  if (ex.length) return res.status(409).json({ message: 'An account with this email already exists.' });
  const [ins] = await db.query("INSERT INTO users (name,email,id_number,department,role,status,password_hash) VALUES (?,?,?,?,?,'pending',?)",
    [name, email.toLowerCase(), id_number, department, role, await bcrypt.hash(password, 10)]);
  await audit(ins.insertId, 'SIGNUP', 'user', ins.insertId, `requested ${role}`);
  res.status(201).json({ message: 'Account created. An administrator must approve it before you can log in.' });
});
r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [[u]] = await db.query('SELECT * FROM users WHERE email=?', [(email || '').toLowerCase()]);
  if (!u) return res.status(401).json({ message: 'Email or password is incorrect.' });
  if (u.locked_until && new Date(u.locked_until) > new Date()) return res.status(423).json({ message: 'Too many failed attempts. Try again in 15 minutes.' });
  if (!(await bcrypt.compare(password || '', u.password_hash))) {
    const f = u.failed_logins + 1;
    await db.query('UPDATE users SET failed_logins=?, locked_until=? WHERE id=?', [f >= 5 ? 0 : f, f >= 5 ? new Date(Date.now() + 15 * 60000) : null, u.id]);
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  if (u.status === 'disabled') return res.status(403).json({ message: 'This account is disabled.' });
  await db.query('UPDATE users SET failed_logins=0, locked_until=NULL WHERE id=?', [u.id]);
  res.cookie('token', jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '8h' }), cookie);
  await audit(u.id, 'LOGIN', 'user', u.id);
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status });
});
r.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out.' }); });
r.get('/me', auth, (req, res) => res.json(req.user));
r.post('/change-password', auth, async (req, res) => {
  const { current, next } = req.body; const [[u]] = await db.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(current || '', u.password_hash))) return res.status(400).json({ message: 'Current password is incorrect.' });
  if (!strong(next)) return res.status(400).json({ message: 'New password needs 8+ characters with upper case, lower case and a digit.' });
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(next, 10), req.user.id]);
  await audit(req.user.id, 'CHANGE_PASSWORD', 'user', req.user.id); res.json({ message: 'Password changed.' });
});
module.exports = r;
