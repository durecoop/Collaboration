const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/profiles'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/memos', require('./routes/memos'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/search', require('./routes/search'));
app.use('/api/chat', require('./routes/chat'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);

  // Render 슬립 방지: 14분마다 self-ping
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL + '/api/health';
    setInterval(() => {
      fetch(url).catch(() => {});
    }, 14 * 60 * 1000);
    console.log(`슬립 방지 활성화: ${url} (14분 간격)`);
  }
});
