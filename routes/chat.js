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
    const result = await callClaudeWithTools(userId, message);
    db.data.chatHistory[userId].push({ role: 'assistant', content: result.reply });
    db.save();
    res.json({ role: 'bot', content: result.reply, actions: result.actions || [] });
  } catch (e) {
    console.error('Claude API 오류:', e.message);
    const fallback = processFallback(message, userId);
    db.data.chatHistory[userId].push({ role: 'assistant', content: fallback });
    db.save();
    res.json({ role: 'bot', content: fallback, actions: [] });
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
//  Tool 정의
// ═══════════════════════════════════════
const TOOLS = [
  {
    name: 'create_task',
    description: '새 업무를 등록합니다. 사용자가 업무 등록/추가/생성을 요청할 때 사용합니다.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '업무 제목' },
        priority: { type: 'string', enum: ['urgent', 'normal'], description: '우선순위 (urgent=긴급, normal=일보따리). 기본값: normal' },
        assignees: { type: 'array', items: { type: 'string' }, description: '담당자 이름 배열. 지정하지 않으면 현재 사용자를 담당자로 설정' },
        startDate: { type: 'string', description: '시작일 (YYYY-MM-DD)' },
        endDate: { type: 'string', description: '마감일 (YYYY-MM-DD)' },
        memo: { type: 'string', description: '메모 내용' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task_status',
    description: '기존 업무의 상태를 변경합니다. 사용자가 업무 상태를 변경/완료/시작/진행 등을 요청할 때 사용합니다.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '상태를 변경할 업무의 제목 (부분 매칭 가능)' },
        status: { type: 'string', enum: ['시작전', '진행중', '완료'], description: '변경할 상태' }
      },
      required: ['title', 'status']
    }
  },
  {
    name: 'delete_task',
    description: '업무를 삭제합니다. 사용자가 업무 삭제/제거를 요청할 때 사용합니다.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '삭제할 업무의 제목 (부분 매칭 가능)' }
      },
      required: ['title']
    }
  }
];

// ═══════════════════════════════════════
//  Tool 실행
// ═══════════════════════════════════════
function executeTool(toolName, input, userName) {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const todayShort = (today.getMonth()+1) + '/' + today.getDate();

  if (toolName === 'create_task') {
    const task = {
      id: db.nextId('tasks'),
      title: input.title,
      priority: input.priority || 'normal',
      status: '시작전',
      startDate: input.startDate || '',
      endDate: input.endDate || '',
      deadline: input.endDate || '',
      assignees: input.assignees && input.assignees.length ? input.assignees : [userName],
      memos: input.memo ? [{ date: todayShort, text: input.memo }] : [],
      attachments: []
    };
    db.data.tasks.push(task);
    db.save();
    return { success: true, message: `업무 "${task.title}"이(가) 등록되었습니다. (담당: ${task.assignees.join(', ')}, 상태: 시작전)`, task };
  }

  if (toolName === 'update_task_status') {
    const searchTitle = input.title.toLowerCase();
    const task = db.data.tasks.find(t => t.title.toLowerCase().includes(searchTitle));
    if (!task) return { success: false, message: `"${input.title}" 업무를 찾을 수 없습니다.` };
    const oldStatus = task.status;
    task.status = input.status;
    db.save();
    return { success: true, message: `업무 "${task.title}"의 상태가 "${oldStatus}" → "${input.status}"(으)로 변경되었습니다.`, task };
  }

  if (toolName === 'delete_task') {
    const searchTitle = input.title.toLowerCase();
    const idx = db.data.tasks.findIndex(t => t.title.toLowerCase().includes(searchTitle));
    if (idx === -1) return { success: false, message: `"${input.title}" 업무를 찾을 수 없습니다.` };
    const removed = db.data.tasks.splice(idx, 1)[0];
    db.save();
    return { success: true, message: `업무 "${removed.title}"이(가) 삭제되었습니다.`, deletedTaskId: removed.id };
  }

  return { success: false, message: '알 수 없는 도구입니다.' };
}

// ═══════════════════════════════════════
//  Claude API 호출 (Tool Use 지원)
// ═══════════════════════════════════════
async function callClaudeWithTools(userId, message) {
  if (!CLAUDE_API_KEY) throw new Error('API 키 없음');

  const user = db.data.users.find(u => u.id === userId);
  const userName = user ? user.name : '';
  const dataContext = buildDataContext(userName);

  const history = (db.data.chatHistory[userId] || []).slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const systemPrompt = `당신은 두레생협 팀 업무 관리 시스템의 AI 어시스턴트입니다.
현재 로그인한 사용자: ${userName}
오늘 날짜: ${new Date().toISOString().slice(0, 10)}

팀원 목록: ${db.data.users.map(u => u.name).join(', ')}

아래는 현재 시스템에 등록된 데이터입니다:
${dataContext}

규칙:
- 한국어로 친근하게 대화하세요
- 업무, 회의, 공지, 일정 등에 대한 질문에 위 데이터를 기반으로 정확히 답하세요
- 사용자가 업무 등록/삭제/상태변경을 요청하면 반드시 해당 도구(tool)를 사용하세요
- 업무 등록 시 담당자를 따로 말하지 않으면 현재 사용자(${userName})를 담당자로 설정하세요
- 도구 사용 후에는 결과를 친근하게 안내하세요
- 이모지를 적절히 사용해서 읽기 좋게 해주세요
- 사용법을 물어보면 매뉴얼 페이지를 안내하세요: /manual.html`;

  const messages = [
    ...history,
    { role: 'user', content: message }
  ];

  // 1차 호출
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
      system: systemPrompt,
      tools: TOOLS,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const actions = [];

  // tool_use가 없으면 바로 텍스트 반환
  if (data.stop_reason !== 'tool_use') {
    const textBlock = data.content.find(b => b.type === 'text');
    return { reply: textBlock ? textBlock.text : '응답을 생성하지 못했습니다.', actions };
  }

  // tool_use 처리
  const toolResults = [];
  for (const block of data.content) {
    if (block.type === 'tool_use') {
      const result = executeTool(block.name, block.input, userName);
      actions.push({ tool: block.name, input: block.input, result });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }
  }

  // 2차 호출: tool 결과를 Claude에게 보내서 사용자에게 전할 메시지 생성
  const followUpMessages = [
    ...messages,
    { role: 'assistant', content: data.content },
    { role: 'user', content: toolResults }
  ];

  const followUp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: followUpMessages
    })
  });

  if (!followUp.ok) {
    // 2차 호출 실패 시 도구 결과 메시지로 대체
    const resultMsgs = actions.map(a => a.result.message);
    return { reply: resultMsgs.join('\n'), actions };
  }

  const followUpData = await followUp.json();
  const textBlock = followUpData.content.find(b => b.type === 'text');
  return { reply: textBlock ? textBlock.text : actions.map(a => a.result.message).join('\n'), actions };
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
