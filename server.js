const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FRAMES_META = path.join(UPLOADS_DIR, 'frames.json');
const API_KEY = process.env.ADMIN_API_KEY || null; // optional API key for upload protection

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(FRAMES_META)) fs.writeFileSync(FRAMES_META, JSON.stringify([]));

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    const base = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/png'];
  if (allowed.includes(file.mimetype) || /\.png$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG files are allowed'), false);
  }
}

const upload = multer({ storage, fileFilter });

const app = express();
app.use(cors());
app.use(express.json());

// Simple API key middleware for uploads (optional)
function requireApiKey(req, res, next) {
  if (!API_KEY) return next();
  const key = req.header('x-api-key') || req.query.key;
  if (!key || key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// read and write helpers
function readFrames() {
  try {
    return JSON.parse(fs.readFileSync(FRAMES_META, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}
function writeFrames(frames) {
  fs.writeFileSync(FRAMES_META, JSON.stringify(frames, null, 2));
}

// POST upload a frame (admin)
app.post('/api/frames', requireApiKey, upload.single('frame'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PNG file required' });
  }
  const frameMeta = {
    id: req.file.filename,
    name: req.file.originalname,
    url: `/frames/${req.file.filename}`,
    uploadedAt: new Date().toISOString()
  };
  const frames = readFrames();
  frames.push(frameMeta);
  writeFrames(frames);
  res.json(frameMeta);
});

// GET list frames
app.get('/api/frames', (req, res) => {
  const frames = readFrames();
  res.json(frames);
});

// serve uploaded files
app.use('/frames', express.static(UPLOADS_DIR, {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // cache uploads
  }
}));

// basic health
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Frame server listening on http://localhost:${PORT}`);
  if (API_KEY) console.log('Admin uploads protected by API key.');
});
