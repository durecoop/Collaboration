const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json([]);
  res.json(db.data.chatHistory[userId] || []);
});

router.post('/', (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ error: '메시지가 필요합니다' });

  if (!db.data.chatHistory[userId]) db.data.chatHistory[userId] = [];
  db.data.chatHistory[userId].push({ role: 'user', content: message });

  const reply = processChat(message, userId);
  db.data.chatHistory[userId].push({ role: 'bot', content: reply });
  db.save();

  res.json({ role: 'bot', content: reply });
});

router.delete('/', (req, res) => {
  const { userId } = req.query;
  if (userId) db.data.chatHistory[userId] = [];
  db.save();
  res.json({ success: true });
});

function processChat(message, userId) {
  const msg = message.toLowerCase();
  const user = db.data.users.find(u => u.id === userId);
  const userName = user ? user.name : '';

  if (msg.includes('업무') || msg.includes('할 일') || msg.includes('할일')) {
    const tasks = db.data.tasks.filter(t => t.assignees.includes(userName) && t.status !== '완료');
    if (tasks.length === 0) return '현재 진행 중인 업무가 없습니다! 🎉';
    let reply = `${userName}님의 진행 중인 업무 (${tasks.length}건):\n`;
    tasks.forEach((t, i) => { reply += `${i + 1}. ${t.title} [${t.status}]${t.deadline ? ` (마감: ${t.deadline})` : ''}\n`; });
    return reply;
  }

  if (msg.includes('긴급') || msg.includes('급한')) {
    const urgent = db.data.tasks.filter(t => t.priority === 'urgent' && t.status !== '완료');
    if (urgent.length === 0) return '현재 긴급 업무가 없습니다! 👍';
    let reply = `긴급 업무 (${urgent.length}건):\n`;
    urgent.forEach((t, i) => { reply += `${i + 1}. ${t.title} [${t.status}]\n`; });
    return reply;
  }

  if (msg.includes('회의') || msg.includes('미팅')) {
    const meetings = db.data.meetings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    if (meetings.length === 0) return '등록된 회의가 없습니다.';
    let reply = '최근 회의:\n';
    meetings.forEach((m, i) => { reply += `${i + 1}. ${m.title} (${m.date})\n`; });
    return reply;
  }

  if (msg.includes('공지') || msg.includes('알림')) {
    const notices = db.data.notices.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    if (notices.length === 0) return '등록된 공지가 없습니다.';
    let reply = '최근 공지:\n';
    notices.forEach((n, i) => { reply += `${i + 1}. ${n.title} (${n.date})\n`; });
    return reply;
  }

  if (msg.includes('안녕') || msg.includes('반가') || msg.includes('하이') || msg.includes('hello')) {
    return `안녕하세요 ${userName}님! 무엇을 도와드릴까요? 😊\n\n💡 이런 것들을 물어보실 수 있어요:\n- "내 업무 알려줘"\n- "긴급 업무 뭐 있어?"\n- "최근 회의 내용"\n- "공지사항 알려줘"`;
  }

  if (msg.includes('도움') || msg.includes('뭐 할 수 있') || msg.includes('기능')) {
    return '저는 이런 것들을 도와드릴 수 있어요:\n\n📋 "내 업무" - 진행 중인 업무 확인\n🔴 "긴급 업무" - 긴급 업무 조회\n📅 "회의" - 최근 회의 내용\n📢 "공지사항" - 최근 공지\n\n자유롭게 물어보세요!';
  }

  return `죄송해요, "${message}"에 대한 정확한 답변을 찾지 못했어요. 😅\n\n"도움말"을 입력하시면 제가 할 수 있는 것들을 알려드릴게요!`;
}

module.exports = router;
