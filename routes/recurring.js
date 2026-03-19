const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.data.recurringTasks);
});

router.post('/', (req, res) => {
  const { title, cycle, day, dayOfWeek, month, assignees } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const task = {
    id: db.nextId('recurringTasks'),
    title, cycle: cycle || 'monthly',
    day: day || null, dayOfWeek: dayOfWeek || null, month: month || null,
    assignees: assignees || [], history: {}
  };
  db.data.recurringTasks.push(task);
  db.save();
  res.json(task);
});

router.put('/:id', (req, res) => {
  const t = db.data.recurringTasks.find(t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: '반복 업무를 찾을 수 없습니다' });

  const { title, cycle, day, dayOfWeek, month, assignees } = req.body;
  if (title !== undefined) t.title = title;
  if (cycle !== undefined) t.cycle = cycle;
  if (day !== undefined) t.day = day;
  if (dayOfWeek !== undefined) t.dayOfWeek = dayOfWeek;
  if (month !== undefined) t.month = month;
  if (assignees !== undefined) t.assignees = assignees;
  db.save();
  res.json(t);
});

router.patch('/:id/history', (req, res) => {
  const t = db.data.recurringTasks.find(t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: '반복 업무를 찾을 수 없습니다' });

  const { periodKey, done } = req.body;
  t.history[periodKey] = !!done;
  db.save();
  res.json(t);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.recurringTasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '반복 업무를 찾을 수 없습니다' });
  db.data.recurringTasks.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

module.exports = router;
