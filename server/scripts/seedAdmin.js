require('dotenv').config();
const bcrypt = require('bcryptjs'), db = require('../config/db');
(async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env');
  const [ex] = await db.query("SELECT id FROM users WHERE role='administrator' LIMIT 1");
  if (ex.length) { console.log('An administrator already exists.'); return process.exit(0); }
  await db.query("INSERT INTO users (name,email,id_number,department,role,status,password_hash) VALUES (?,?,?,?,?,?,?)",
    [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), 'ADMIN-001', 'Administration', 'administrator', 'active', await bcrypt.hash(ADMIN_PASSWORD, 10)]);
  console.log('Administrator created:', ADMIN_EMAIL); process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
