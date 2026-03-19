const express = require('express');
const router = express.Router();
const db = require('../database');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json([]);
  res.json(db.data.chatHistory[userId] || []);
});

router.post('/', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ error: '메시지가 필요합니다' });

  if (!db.data.chatHistory[userId]) db.data.chatHistory[userId] = [];
  db.data.chatHistory[userId].push({ role: 'user', content: message });

  try {
    const reply = await callClaude(userId, message);
    db.data.chatHistory[userId].push({ role: 'assistant', content: reply });
    db.save();
    res.json({ role: 'bot', content: reply });
  } catch (e) {
    console.error('Claude API 오류:', e.message);
    const fallback = processFallback(message, userId);
    db.data.chatHistory[userId].push({ role: 'assistant', content: fallback });
    db.save();
    res.json({ role: 'bot', content: fallback });
  }
});

// POST /api/chat/assist - AI 메모 작성 도우미
router.post('/assist', async (req, res) => {
  const { userId, text, context } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'API 키 없음' });

  const user = db.data.users.find(u => u.id === userId);
  const userName = user ? user.name : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `당신은 두레생협 팀의 업무 메모/공지 작성을 도와주는 AI 어시스턴트입니다.
사용자: ${userName}

규칙:
- 사용자가 입력한 내용을 기반으로 더 체계적이고 상세한 메모/공지로 다듬어주세요
- 내용이 비어있으면 맥락(context)을 보고 적절한 초안을 작성해주세요
- 한국어로 작성하세요
- 이모지를 적절히 활용해서 가독성을 높이세요
- 결과만 출력하세요 (설명 없이)`,
        messages: [{
          role: 'user',
          content: text
            ? `아래 내용을 다듬어주세요:\n\n${text}${context ? '\n\n맥락: ' + context : ''}`
            : `다음 맥락에 맞는 메모 초안을 작성해주세요:\n\n${context || '일반 업무 메모'}`
        }]
      })
    });

    if (!response.ok) throw new Error('API 오류');
    const data = await response.json();
    res.json({ result: data.content[0].text });
  } catch (e) {
    console.error('AI Assist 오류:', e.message);
    res.status(500).json({ error: 'AI 도우미 오류' });
  }
});

router.delete('/', (req, res) => {
  const { userId } = req.query;
  if (userId) db.data.chatHistory[userId] = [];
  db.save();
  res.json({ success: true });
});

// ═══════════════════════════════════════
//  Claude API 호출
// ═══════════════════════════════════════
async function callClaude(userId, message) {
  if (!CLAUDE_API_KEY) throw new Error('API 키 없음');

  const user = db.data.users.find(u => u.id === userId);
  const userName = user ? user.name : '';

  // 현재 데이터 요약을 시스템 프롬프트에 포함
  const dataContext = buildDataContext(userName);

  // 최근 대화 히스토리 (최대 10개)
  const history = (db.data.chatHistory[userId] || []).slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `당신은 두레생협 팀 업무 관리 시스템의 AI 어시스턴트입니다.
현재 로그인한 사용자: ${userName}

아래는 현재 시스템에 등록된 데이터입니다:
${dataContext}

규칙:
- 한국어로 친근하게 대화하세요
- 업무, 회의, 공지, 일정 등에 대한 질문에 위 데이터를 기반으로 정확히 답하세요
- 데이터가 없으면 "아직 등록된 내용이 없습니다"라고 안내하세요
- 답변은 간결하게 하되, 필요한 정보는 빠짐없이 포함하세요
- 이모지를 적절히 사용해서 읽기 좋게 해주세요
- 사용법, 매뉴얼, 도움말을 물어보면 매뉴얼 페이지를 안내하세요: /manual.html
- 업무 등록 방법을 물어보면: N키를 누르거나 캘린더에서 +일정추가, 기간은 FROM~TO로 설정, +1주 버튼 활용, 🤖AI 도움 버튼으로 메모 자동 작성 가능하다고 안내하세요`,
      messages: [
        ...history,
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function buildDataContext(userName) {
  const parts = [];

  // 업무
  const allTasks = db.data.tasks;
  const myTasks = allTasks.filter(t => t.assignees.includes(userName) && t.status !== '완료');
  const urgentTasks = allTasks.filter(t => t.priority === 'urgent' && t.status !== '완료');
  parts.push(`[업무] 전체 ${allTasks.length}건, 내 미완료 ${myTasks.length}건, 긴급 ${urgentTasks.length}건`);
  if (myTasks.length > 0) {
    parts.push('내 업무: ' + myTasks.map(t => `${t.title}(${t.status}${t.deadline ? ', 마감:'+t.deadline : ''})`).join(' / '));
  }
  if (urgentTasks.length > 0) {
    parts.push('긴급 업무: ' + urgentTasks.map(t => `${t.title}(담당:${t.assignees.join(',')})`).join(' / '));
  }

  // 회의록
  const meetings = db.data.meetings.slice().sort((a, b) => b.date.localeCompare(a.date));
  parts.push(`[회의록] ${meetings.length}건`);
  if (meetings.length > 0) {
    meetings.slice(0, 3).forEach(m => {
      const checks = m.checks || [];
      const done = checks.filter(c => c.done).length;
      parts.push(`- ${m.title} (${m.date}, 참석:${m.attendees.join(',')}, 체크:${done}/${checks.length})`);
    });
  }

  // 공지
  const notices = db.data.notices.slice().sort((a, b) => b.date.localeCompare(a.date));
  const unread = notices.filter(n => !n.readBy.includes(userName));
  parts.push(`[공지] ${notices.length}건, 안읽음 ${unread.length}건`);
  if (notices.length > 0) {
    notices.slice(0, 3).forEach(n => {
      parts.push(`- ${n.title} (${n.date}, ${n.readBy.includes(userName) ? '읽음' : '안읽음'})`);
    });
  }

  // 메모
  const myMemos = db.data.memos.filter(m => m.owner === userName);
  parts.push(`[내 메모] ${myMemos.length}건`);

  // 캘린더
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = db.data.calendarEvents.filter(e => e.date === today);
  const upcoming = db.data.calendarEvents.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  parts.push(`[오늘 일정] ${todayEvents.length}건`);
  if (upcoming.length > 0) {
    parts.push('다가오는 일정: ' + upcoming.map(e => `${e.title}(${e.date})`).join(' / '));
  }

  // 반복 업무
  parts.push(`[반복 업무] ${db.data.recurringTasks.length}건`);

  // 팀 목표
  const yearlyGoals = db.data.teamGoals.yearly;
  parts.push(`[연간 목표] ${yearlyGoals.length}건`);
  yearlyGoals.forEach(g => parts.push(`- ${g.title}: ${g.progress}% (${g.notes})`));

  // 팀원 정보
  parts.push(`[팀원] ${db.data.users.map(u => u.name + '(' + u.dept + ')').join(', ')}`);

  return parts.join('\n');
}

// API 키 없을 때 폴백
function processFallback(message, userId) {
  return 'AI 어시스턴트가 현재 사용 불가합니다. 관리자에게 문의해주세요.';
}

module.exports = router;
