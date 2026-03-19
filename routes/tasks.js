const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json(db.data.tasks);
});

router.get('/:id', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, priority, status, deadline, assignees } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const task = {
    id: db.nextId('tasks'),
    title,
    priority: priority || 'normal',
    status: status || '시작전',
    deadline: deadline || '',
    assignees: assignees || [],
    memos: []
  };
  db.data.tasks.push(task);
  db.save();
  res.json(task);
});

router.put('/:id', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });

  const { title, priority, status, deadline, assignees } = req.body;
  if (title !== undefined) task.title = title;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (deadline !== undefined) task.deadline = deadline;
  if (assignees !== undefined) task.assignees = assignees;
  db.save();
  res.json(task);
});

router.patch('/:id/status', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });

  task.status = req.body.status;
  db.save();
  res.json(task);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });
  db.data.tasks.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

router.post('/:id/memos', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });

  const { date, text } = req.body;
  if (!text) return res.status(400).json({ error: '메모 내용이 필요합니다' });

  task.memos.push({ date: date || new Date().toLocaleDateString('ko-KR'), text });
  db.save();
  res.json(task);
});

module.exports = router;
