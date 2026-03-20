const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const uploadDir = path.join(__dirname, '..', 'uploads', 'tasks');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  res.json(db.data.tasks);
});

router.get('/:id', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, priority, status, deadline, startDate, endDate, assignees } = req.body;
  if (!title) return res.status(400).json({ error: '제목이 필요합니다' });

  const task = {
    id: db.nextId('tasks'),
    title,
    priority: priority || 'normal',
    status: status || '시작전',
    startDate: startDate || '',
    endDate: endDate || '',
    deadline: endDate || deadline || '',
    assignees: assignees || [],
    memos: [],
    attachments: []
  };
  db.data.tasks.push(task);
  db.save();
  res.json(task);
});

router.put('/:id', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });

  const { title, priority, status, deadline, startDate, endDate, assignees } = req.body;
  if (title !== undefined) task.title = title;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (startDate !== undefined) task.startDate = startDate;
  if (endDate !== undefined) { task.endDate = endDate; task.deadline = endDate; }
  if (deadline !== undefined && endDate === undefined) task.deadline = deadline;
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

// ── 첨부파일 업로드 ──
router.post('/:id/attachments', upload.array('files', 10), (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });

  if (!task.attachments) task.attachments = [];

  req.files.forEach(f => {
    task.attachments.push({
      originalName: f.originalname,
      filename: f.filename,
      url: '/uploads/tasks/' + f.filename,
      size: f.size
    });
  });

  db.save();
  res.json(task);
});

// ── 첨부파일 삭제 ──
router.delete('/:id/attachments/:idx', (req, res) => {
  const task = db.data.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: '업무를 찾을 수 없습니다' });
  if (!task.attachments) task.attachments = [];

  const idx = Number(req.params.idx);
  if (idx < 0 || idx >= task.attachments.length) return res.status(400).json({ error: '잘못된 인덱스' });

  const removed = task.attachments.splice(idx, 1)[0];
  // 파일 삭제 시도
  const filePath = path.join(uploadDir, removed.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.save();
  res.json({ attachments: task.attachments });
});

module.exports = router;
