const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.data.notices);
});

router.get('/:id', (req, res) => {
  const n = db.data.notices.find(n => n.id === Number(req.params.id));
  if (!n) return res.status(404).json({ error: '공지를 찾을 수 없습니다' });
  res.json(n);
});

router.post('/', (req, res) => {
  const { title, type, date, author, content } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const notice = {
    id: db.nextId('notices'),
    title, type: type || '공지',
    date: date || new Date().toISOString().slice(0, 10),
    author: author || '', content: content || '',
    readBy: []
  };
  db.data.notices.push(notice);
  db.save();
  res.json(notice);
});

router.put('/:id', (req, res) => {
  const n = db.data.notices.find(n => n.id === Number(req.params.id));
  if (!n) return res.status(404).json({ error: '공지를 찾을 수 없습니다' });

  const { title, type, date, content } = req.body;
  if (title !== undefined) n.title = title;
  if (type !== undefined) n.type = type;
  if (date !== undefined) n.date = date;
  if (content !== undefined) n.content = content;
  db.save();
  res.json(n);
});

router.post('/:id/read', (req, res) => {
  const n = db.data.notices.find(n => n.id === Number(req.params.id));
  if (!n) return res.status(404).json({ error: '공지를 찾을 수 없습니다' });

  const { userName } = req.body;
  if (userName && !n.readBy.includes(userName)) {
    n.readBy.push(userName);
    db.save();
  }
  res.json(n);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.notices.findIndex(n => n.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '공지를 찾을 수 없습니다' });
  db.data.notices.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

module.exports = router;
