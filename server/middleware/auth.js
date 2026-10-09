const jwt = require('jsonwebtoken'), db = require('../config/db');
exports.auth = async (req, res, next) => {
  try {
    const t = req.cookies.token; if (!t) return res.status(401).json({ message: 'Please log in.' });
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    const [[u]] = await db.query('SELECT id,name,email,role,status,department,id_number FROM users WHERE id=?', [id]);
    if (!u || u.status === 'disabled') return res.status(401).json({ message: 'Account unavailable.' });
    req.user = u; next();
  } catch { res.status(401).json({ message: 'Session expired. Please log in again.' }); }
};
// Role check runs on the server for every protected route; the frontend only hides menus.
exports.role = (...roles) => (req, res, next) =>
  req.user.status !== 'active' ? res.status(403).json({ message: 'Account is waiting for approval.' })
  : roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Your role cannot do this.' });
exports.active = (req, res, next) => (req.user.status === 'active' ? next() : res.status(403).json({ message: 'Account is waiting for approval.' }));
