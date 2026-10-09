require('dotenv').config();
const express = require('express'), helmet = require('helmet'), cors = require('cors'), cookieParser = require('cookie-parser'), rateLimit = require('express-rate-limit');
const { auth, active } = require('./middleware/auth'), scheduler = require('./jobs/scheduler');
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true })); app.use(express.json()); app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
// wrap async handlers so errors reach the error handler
const wrap = r => { r.stack.forEach(l => { if (l.route) l.route.stack.forEach(h => { const f = h.handle; if (f.length < 4) h.handle = (q, s, n) => Promise.resolve(f(q, s, n)).catch(n); }); }); return r; };
app.use('/api/auth', wrap(require('./routes/auth')));
const api = express.Router(); api.use(auth, active);
api.use('/users', wrap(require('./routes/users'))); api.use('/equipment', wrap(require('./routes/equipment')));
api.use('/calibrations', wrap(require('./routes/calibrations'))); api.use('/', wrap(require('./routes/workflow')));
app.use('/api', (req, res, next) => (req.path.startsWith('/auth') ? next() : api(req, res, next)));
app.use('/api', (q, s) => s.status(404).json({ message: 'Not found.' }));
app.use((e, q, s, n) => { console.error(e); s.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : e.message }); });
const port = process.env.PORT || 5000;
if (require.main === module) app.listen(port, () => { console.log('LCMS API on', port); scheduler.start(); });
module.exports = app;
