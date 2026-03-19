const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.cookies.userId + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => {
  res.json(db.data.users);
});

router.put('/profile', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });

  const user = db.data.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

  const { nickname } = req.body;
  user.nickname = nickname || '';
  db.save();
  res.json(user);
});

router.post('/photo', upload.single('photo'), (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });

  const user = db.data.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  if (!req.file) return res.status(400).json({ error: '파일이 없습니다' });

  user.photo = '/uploads/' + req.file.filename;
  db.save();
  res.json(user);
});

router.delete('/photo', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: '로그인 필요' });

  const user = db.data.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

  if (user.photo) {
    const filePath = path.join(__dirname, '..', user.photo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  user.photo = '';
  db.save();
  res.json({ success: true });
});

module.exports = router;
