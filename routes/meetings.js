const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.data.meetings);
});

router.get('/:id', (req, res) => {
  const m = db.data.meetings.find(m => m.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: '회의록을 찾을 수 없습니다' });
  res.json(m);
});

router.post('/', (req, res) => {
  const { title, date, agenda, content, attendees, checks } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const meeting = {
    id: db.nextId('meetings'),
    title, date: date || '', agenda: agenda || '', content: content || '',
    attendees: attendees || [],
    checks: (checks || []).map(c => ({ text: c.text, who: c.who, done: !!c.done }))
  };
  db.data.meetings.push(meeting);
  db.save();
  res.json(meeting);
});

router.put('/:id', (req, res) => {
  const m = db.data.meetings.find(m => m.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: '회의록을 찾을 수 없습니다' });

  const { title, date, agenda, content, attendees, checks } = req.body;
  if (title !== undefined) m.title = title;
  if (date !== undefined) m.date = date;
  if (agenda !== undefined) m.agenda = agenda;
  if (content !== undefined) m.content = content;
  if (attendees !== undefined) m.attendees = attendees;
  if (checks !== undefined) m.checks = checks.map(c => ({ text: c.text, who: c.who, done: !!c.done }));
  db.save();
  res.json(m);
});

router.patch('/:id/checks/:checkIdx', (req, res) => {
  const m = db.data.meetings.find(m => m.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: '회의록을 찾을 수 없습니다' });

  const idx = Number(req.params.checkIdx);
  if (m.checks[idx] !== undefined) {
    m.checks[idx].done = !!req.body.done;
    db.save();
  }
  res.json(m);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.meetings.findIndex(m => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '회의록을 찾을 수 없습니다' });
  db.data.meetings.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

module.exports = router;
