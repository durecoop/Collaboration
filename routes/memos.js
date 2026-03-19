const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { owner } = req.query;
  let memos = db.data.memos;
  if (owner) memos = memos.filter(m => m.owner === owner);
  res.json(memos);
});

router.get('/:id', (req, res) => {
  const m = db.data.memos.find(m => m.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: '메모를 찾을 수 없습니다' });
  res.json(m);
});

router.post('/', (req, res) => {
  const { title, content, date, owner } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const memo = {
    id: db.nextId('memos'),
    title, content: content || '',
    date: date || new Date().toISOString().slice(0, 10),
    owner: owner || ''
  };
  db.data.memos.push(memo);
  db.save();
  res.json(memo);
});

router.put('/:id', (req, res) => {
  const m = db.data.memos.find(m => m.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: '메모를 찾을 수 없습니다' });

  const { title, content, date } = req.body;
  if (title !== undefined) m.title = title;
  if (content !== undefined) m.content = content;
  if (date !== undefined) m.date = date;
  db.save();
  res.json(m);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.memos.findIndex(m => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '메모를 찾을 수 없습니다' });
  db.data.memos.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

module.exports = router;
