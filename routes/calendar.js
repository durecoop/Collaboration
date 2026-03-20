const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { year, month } = req.query;
  let events = db.data.calendarEvents;
  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    events = events.filter(e => e.date.startsWith(prefix));
  }
  res.json(events);
});

router.post('/', (req, res) => {
  const { date, title, cat, who, startTime, endTime, location, description } = req.body;
  if (!title || !date) return res.status(400).json({ error: '제목과 날짜가 필요합니다' });

  const event = {
    id: db.nextId('calendarEvents'), date, title, cat: cat || 'task', who: who || '',
    startTime: startTime || '', endTime: endTime || '', location: location || '', description: description || ''
  };
  db.data.calendarEvents.push(event);
  db.save();
  res.json(event);
});

router.put('/:id', (req, res) => {
  const e = db.data.calendarEvents.find(e => e.id === Number(req.params.id));
  if (!e) return res.status(404).json({ error: '이벤트를 찾을 수 없습니다' });

  const { date, title, cat, who, startTime, endTime, location, description } = req.body;
  if (date !== undefined) e.date = date;
  if (title !== undefined) e.title = title;
  if (cat !== undefined) e.cat = cat;
  if (who !== undefined) e.who = who;
  if (startTime !== undefined) e.startTime = startTime;
  if (endTime !== undefined) e.endTime = endTime;
  if (location !== undefined) e.location = location;
  if (description !== undefined) e.description = description;
  db.save();
  res.json(e);
});

router.delete('/:id', (req, res) => {
  const idx = db.data.calendarEvents.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '이벤트를 찾을 수 없습니다' });
  db.data.calendarEvents.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

module.exports = router;
