const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/login', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: '사용자 ID가 필요합니다' });

  const user = db.data.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

  res.cookie('userId', userId, { httpOnly: false, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.json({ user: null });
  const user = db.data.users.find(u => u.id === userId);
  res.json({ user: user || null });
});

module.exports = router;
