const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ tasks: [], meetings: [], notices: [], memos: [] });

  const match = (str) => str && str.toLowerCase().includes(q);

  res.json({
    tasks: db.data.tasks.filter(t => match(t.title)),
    meetings: db.data.meetings.filter(m => match(m.title) || match(m.agenda) || match(m.content)),
    notices: db.data.notices.filter(n => match(n.title) || match(n.content)),
    memos: db.data.memos.filter(m => match(m.title) || match(m.content)),
  });
});

module.exports = router;
