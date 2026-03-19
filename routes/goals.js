const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.data.teamGoals);
});

router.post('/yearly', (req, res) => {
  const { title, progress, notes } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const goal = { id: db.nextId('yearlyGoals'), title, progress: progress || 0, notes: notes || '' };
  db.data.teamGoals.yearly.push(goal);
  db.save();
  res.json(goal);
});

router.put('/yearly/:id', (req, res) => {
  const g = db.data.teamGoals.yearly.find(g => g.id === Number(req.params.id));
  if (!g) return res.status(404).json({ error: '목표를 찾을 수 없습니다' });

  const { title, progress, notes } = req.body;
  if (title !== undefined) g.title = title;
  if (progress !== undefined) g.progress = progress;
  if (notes !== undefined) g.notes = notes;
  db.save();
  res.json(g);
});

router.delete('/yearly/:id', (req, res) => {
  const idx = db.data.teamGoals.yearly.findIndex(g => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '목표를 찾을 수 없습니다' });
  db.data.teamGoals.yearly.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

router.post('/monthly', (req, res) => {
  const { month, title, progress, notes } = req.body;
  if (!title || !month) return res.status(400).json({ error: '제목과 월이 필요합니다' });

  if (!db.data.teamGoals.monthly[month]) db.data.teamGoals.monthly[month] = [];
  const goal = { id: db.nextId('monthlyGoals'), title, progress: progress || 0, notes: notes || '' };
  db.data.teamGoals.monthly[month].push(goal);
  db.save();
  res.json(goal);
});

router.put('/monthly/:id', (req, res) => {
  const { title, progress, notes } = req.body;
  for (const month of Object.keys(db.data.teamGoals.monthly)) {
    const g = db.data.teamGoals.monthly[month].find(g => g.id === Number(req.params.id));
    if (g) {
      if (title !== undefined) g.title = title;
      if (progress !== undefined) g.progress = progress;
      if (notes !== undefined) g.notes = notes;
      db.save();
      return res.json(g);
    }
  }
  res.status(404).json({ error: '목표를 찾을 수 없습니다' });
});

router.delete('/monthly/:id', (req, res) => {
  for (const month of Object.keys(db.data.teamGoals.monthly)) {
    const idx = db.data.teamGoals.monthly[month].findIndex(g => g.id === Number(req.params.id));
    if (idx !== -1) {
      db.data.teamGoals.monthly[month].splice(idx, 1);
      db.save();
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: '목표를 찾을 수 없습니다' });
});

module.exports = router;
