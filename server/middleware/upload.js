const multer = require('multer'), path = require('path'), fs = require('fs');
const dir = path.join(__dirname, '../uploads'); fs.mkdirSync(dir, { recursive: true });
module.exports = multer({
  storage: multer.diskStorage({ destination: dir, filename: (r, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (r, f, cb) => (['application/pdf', 'image/jpeg', 'image/png'].includes(f.mimetype) ? cb(null, true) : cb(new Error('Certificate must be a PDF, JPG or PNG file.'))) });
