const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'db.json');

// ═══════════════════════════════════════
//  기본 데이터 (시드)
// ═══════════════════════════════════════
const DEFAULT_DATA = {
  users: [
    { id: 'soyoung', name: '임소영', dept: '쇼핑몰운영파트', color: '#ff8f00', initial: '소', nickname: '', photo: '' },
    { id: 'seulgi', name: '박슬기', dept: '쇼핑몰운영파트', color: '#795548', initial: '슬', nickname: '', photo: '' },
    { id: 'seona', name: '이선아', dept: '상담파트', color: '#e91e63', initial: '선', nickname: '', photo: '' },
    { id: 'miri', name: '이미리', dept: '상담파트', color: '#9c27b0', initial: '미', nickname: '', photo: '' },
    { id: 'mijeong', name: '김미정', dept: '상담파트', color: '#3f51b5', initial: '정', nickname: '', photo: '' },
    { id: 'eunju', name: '정은주', dept: '상담파트', color: '#00897b', initial: '은', nickname: '', photo: '' },
    { id: 'jiwon', name: '이지원', dept: '쇼핑몰운영파트', color: '#155940', initial: '지', nickname: '', photo: '' },
  ],
  tasks: [
    { id: 1, title: '클라이언트 제안서 수정', priority: 'urgent', status: '진행중', deadline: '2026-03-16', assignees: ['이지원','임소영'], memos: [{date:'3/14',text:'1차 초안 작성 완료'},{date:'3/15',text:'김 대리 피드백: 예산 부분 수정 필요'},{date:'3/16',text:'디자인은 임소영이 맡기로 함'},{date:'3/17',text:'최종본 PDF 변환 후 메일 발송 예정'}] },
    { id: 2, title: '3월 예산안 최종 확인', priority: 'urgent', status: '시작전', deadline: '2026-03-19', assignees: ['이지원'], memos: [] },
    { id: 3, title: '회의실 예약 시스템 리서치', priority: 'normal', status: '진행중', deadline: '2026-03-21', assignees: ['이지원','박슬기'], memos: [] },
    { id: 4, title: '주간 보고서 양식 정리', priority: 'normal', status: '시작전', deadline: '2026-03-25', assignees: ['이지원'], memos: [] },
    { id: 5, title: '팀 워크숍 장소 알아보기', priority: 'normal', status: '완료', deadline: '', assignees: ['임소영','박슬기'], memos: [] },
    { id: 6, title: 'SNS 콘텐츠 3월분 제작', priority: 'urgent', status: '진행중', deadline: '2026-03-20', assignees: ['임소영'], memos: [] },
    { id: 7, title: '클라이언트 제안서 디자인', priority: 'normal', status: '진행중', deadline: '', assignees: ['임소영'], memos: [] },
    { id: 8, title: '서버 모니터링 설정', priority: 'normal', status: '시작전', deadline: '2026-03-22', assignees: ['박슬기'], memos: [] },
    { id: 9, title: '2월 실적 보고서 작성', priority: 'normal', status: '완료', deadline: '2026-03-15', assignees: ['이지원'], memos: [] },
    { id: 10, title: '신규 프로젝트 킥오프 미팅', priority: 'normal', status: '완료', deadline: '2026-03-14', assignees: ['이지원','임소영','박슬기'], memos: [] },
    { id: 11, title: '거래처 계약서 검토', priority: 'normal', status: '완료', deadline: '2026-03-12', assignees: ['이지원'], memos: [] },
    { id: 12, title: 'SNS 2월 결산 리포트', priority: 'normal', status: '완료', deadline: '2026-03-11', assignees: ['임소영'], memos: [] },
    { id: 13, title: '팀 회식 장소 예약', priority: 'normal', status: '완료', deadline: '2026-03-10', assignees: ['박슬기'], memos: [] },
    { id: 14, title: '1분기 KPI 중간점검', priority: 'normal', status: '완료', deadline: '2026-03-07', assignees: ['이지원','임소영','박슬기'], memos: [] },
  ],
  meetings: [
    { id: 1, title: '주간 정기회의 - 3월 3주차', date: '2026-03-18', attendees: ['이지원','임소영','박슬기'],
      agenda: '1. 타임세일 진행 상황 공유\n2. 클라이언트 제안서 마감 일정 논의\n3. 4월 프로모션 기획 아이디어 브레인스토밍\n4. 사은품 이벤트 중간 현황',
      content: '- 타임세일 POP 설치 완료, SNS 포스팅은 오늘 중 올리기로\n- 제안서 디자인 임소영 작업 중, 내일까지 1차 완성 예정\n- 4월 프로모션은 "봄맞이 코디 제안" 컨셉으로 진행\n- 사은품 파우치 현재 70% 소진',
      checks: [{text:'매장 POP 최종 점검',who:'박슬기',done:true},{text:'SNS 홍보 포스팅 업로드',who:'임소영',done:false},{text:'제안서 예산 파트 수정',who:'이지원',done:true},{text:'4월 프로모션 기획안 초안 작성',who:'임소영',done:false},{text:'사은품 추가 발주 검토',who:'이지원',done:false}]
    },
    { id: 2, title: '킥오프 미팅 - 신규 프로젝트', date: '2026-03-14', attendees: ['이지원','임소영','박슬기'],
      agenda: '1. 프로젝트 목표 설정\n2. 역할 분담\n3. 전체 일정 수립\n4. 첫 마일스톤 결정',
      content: '- 팀 업무 관리 웹 프로그램 직접 개발하기로 결정\n- 이지원: 프로젝트 리더 + 백엔드, 임소영: 프론트엔드 + 디자인, 박슬기: 인프라 + 테스트\n- 3월 내 프로토타입 완성 목표\n- 첫 마일스톤: 3/21 요구사항 정리 완료',
      checks: [{text:'요구사항 문서 각자 작성',who:'전체',done:true},{text:'기술 스택 조사',who:'박슬기',done:true},{text:'UI 레퍼런스 수집',who:'임소영',done:true},{text:'DB 구조 초안 설계',who:'이지원',done:false}]
    },
    { id: 3, title: '1분기 KPI 중간점검 회의', date: '2026-03-07', attendees: ['이지원','임소영','박슬기'],
      agenda: '1. 팀별 KPI 달성률 확인\n2. 하반기 목표 조정 논의',
      content: '- 1분기 매출 목표 대비 92% 달성 중\n- SNS 팔로워 증가율 목표 초과 달성\n- 고객 만족도 설문 결과 4.2/5.0\n- 2분기에는 온라인 채널 강화에 집중하기로',
      checks: [{text:'1분기 실적 보고서 최종 정리',who:'이지원',done:true},{text:'SNS 분석 리포트 작성',who:'임소영',done:true},{text:'서버 성능 리포트 정리',who:'박슬기',done:true},{text:'2분기 KPI 목표 초안',who:'이지원',done:true}]
    },
  ],
  notices: [
    { id: 1, title: '🔥 이번주 타임세일: 봄시즌 신상품 30% OFF', type: '타임세일', date: '2026-03-18', author: '이지원',
      content: '📅 기간: 3/18(화) ~ 3/22(일)\n\n📦 대상: 봄시즌 신상품 전품목\n\n💰 할인율: 30% OFF\n\n📋 할 일:\n- 매장 POP 설치 (박슬기)\n- SNS 홍보 포스팅 (임소영)\n- 매장 재고 확인 (이지원)\n\n⚠️ 주의사항:\n- 기존 세일 품목과 중복 할인 불가\n- 멤버십 추가 할인은 적용 가능\n- 재고 소진 시 개별 품목 종료 가능',
      readBy: ['이지원']
    },
    { id: 2, title: '🎁 3월 사은품 증정 이벤트 안내', type: '증정이벤트', date: '2026-03-17', author: '임소영',
      content: '🎁 이벤트: 5만원 이상 구매 시 미니 파우치 증정\n\n📅 기간: 3/17(월) ~ 3/31(월) 또는 재고 소진시\n\n📦 사은품 수량:\n- 각 매장 50개 배정\n- 추가 수량 필요 시 이지원에게 요청\n\n📋 진행 방법:\n1. 결제 완료 후 영수증 확인\n2. 5만원 이상이면 사은품 전달\n3. 사은품 대장에 기록 (수량 관리)\n\n⚠️ 주의:\n- 교환/환불 시 사은품 회수\n- 온라인 구매 건은 해당 없음',
      readBy: ['임소영','박슬기']
    },
    { id: 3, title: '지난주 타임세일 결과 공유', type: '타임세일', date: '2026-03-10', author: '이지원',
      content: '3/10~3/14 타임세일 매출 요약: 전주 대비 23% 상승.\n인기 품목: 스프링코트, 니트가디건',
      readBy: ['이지원','임소영','박슬기']
    },
    { id: 4, title: '3월 근무 일정 안내', type: '공지', date: '2026-03-05', author: '이지원',
      content: '3월 공휴일 및 대체 근무일 안내입니다.\n달력 확인해주세요.',
      readBy: ['이지원','임소영','박슬기']
    },
  ],
  memos: [
    { id: 1, title: '타임세일 체크리스트', content: 'POP 설치 확인, 할인 태그 부착, SNS 홍보 포스팅 예약, 재고 수량 체크', date: '2026-03-18', owner: '이지원' },
    { id: 2, title: '거래처 미팅 메모', content: '담당자: 김과장, 납품 단가 5% 인하 요청, 다음 미팅 4월 첫째주 예정', date: '2026-03-17', owner: '이지원' },
    { id: 3, title: '신상품 아이디어', content: '여름 시즌 준비: 린넨 소재 의류, 쿨링 액세서리, 비치웨어 라인 검토', date: '2026-03-15', owner: '이지원' },
    { id: 4, title: '팀 회식 후기', content: '장소: 강남 이탈리안 레스토랑, 분위기 좋았음. 다음엔 한식으로 하자는 의견', date: '2026-03-10', owner: '이지원' },
  ],
  calendarEvents: [
    { id: 1, date: '2026-03-16', title: '제안서 수정 마감', cat: 'task', who: '이지원, 임소영' },
    { id: 2, date: '2026-03-17', title: '거래처 미팅', cat: 'meeting', who: '이지원' },
    { id: 3, date: '2026-03-18', title: '팀 주간회의', cat: 'meeting', who: '전체' },
    { id: 4, date: '2026-03-18', title: '타임세일 시작', cat: 'event', who: '전체' },
    { id: 5, date: '2026-03-18', title: '제안서 수정', cat: 'task', who: '이지원, 임소영' },
    { id: 6, date: '2026-03-19', title: '예산안 최종 확인', cat: 'task', who: '이지원' },
    { id: 7, date: '2026-03-20', title: 'SNS 콘텐츠 제작', cat: 'task', who: '임소영' },
    { id: 8, date: '2026-03-21', title: '회의실 리서치', cat: 'task', who: '이지원, 박슬기' },
    { id: 9, date: '2026-03-21', title: '박슬기 연차', cat: 'leave', who: '박슬기' },
    { id: 10, date: '2026-03-22', title: '서버 모니터링', cat: 'task', who: '박슬기' },
    { id: 11, date: '2026-03-24', title: '월간 정기회의', cat: 'meeting', who: '전체' },
    { id: 12, date: '2026-03-25', title: '보고서 양식 정리', cat: 'task', who: '이지원' },
    { id: 13, date: '2026-03-27', title: '임소영 연차', cat: 'leave', who: '임소영' },
    { id: 14, date: '2026-03-31', title: '사은품 증정 종료', cat: 'event', who: '전체' },
    { id: 15, date: '2026-03-07', title: 'KPI 중간점검', cat: 'done', who: '전체' },
    { id: 16, date: '2026-03-10', title: '회식 장소 예약', cat: 'done', who: '박슬기' },
    { id: 17, date: '2026-03-12', title: '계약서 검토', cat: 'done', who: '이지원' },
    { id: 18, date: '2026-03-14', title: '킥오프 미팅', cat: 'done', who: '전체' },
    { id: 19, date: '2026-03-15', title: '실적 보고서', cat: 'done', who: '이지원' },
    { id: 20, date: '2026-03-11', title: 'SNS 결산 리포트', cat: 'done', who: '임소영' },
  ],
  recurringTasks: [
    { id: 1, title: '세금계산서 발행', cycle: 'monthly', day: 5, dayOfWeek: null, month: null, assignees: ['이지원'], history: {'2026-01': true, '2026-02': true, '2026-03': false} },
    { id: 2, title: '재고 실사', cycle: 'monthly', day: 15, dayOfWeek: null, month: null, assignees: ['박슬기'], history: {'2026-01': true, '2026-02': true, '2026-03': false} },
    { id: 3, title: '월간 매출 보고서 작성', cycle: 'monthly', day: 25, dayOfWeek: null, month: null, assignees: ['이지원','임소영'], history: {'2026-01': true, '2026-02': true, '2026-03': false} },
    { id: 4, title: '분기별 KPI 리뷰', cycle: 'yearly', day: 31, dayOfWeek: null, month: 3, assignees: ['이지원','임소영','박슬기'], history: {'2026-03': false} },
    { id: 5, title: '연간 사업계획 수립', cycle: 'yearly', day: 15, dayOfWeek: null, month: 1, assignees: ['이지원'], history: {'2026-01': true} },
    { id: 6, title: '주간보고 작성', cycle: 'weekly', day: null, dayOfWeek: 1, month: null, assignees: ['이지원'], history: {'2026-W10': true, '2026-W11': true, '2026-W12': false} },
    { id: 7, title: '팀 미팅 준비', cycle: 'weekly', day: null, dayOfWeek: 3, month: null, assignees: ['이지원','임소영','박슬기'], history: {'2026-W10': true, '2026-W11': true, '2026-W12': false} },
    { id: 8, title: '주간 정산', cycle: 'weekly', day: null, dayOfWeek: 5, month: null, assignees: ['박슬기'], history: {'2026-W10': true, '2026-W11': true, '2026-W12': false} },
  ],
  teamGoals: {
    yearly: [
      { id: 1, title: '연매출 12억 달성', progress: 25, notes: '1분기 목표 대비 92% 달성 중' },
      { id: 2, title: '온라인 채널 매출 비중 30% 달성', progress: 18, notes: 'SNS 팔로워 증가율 목표 초과' },
      { id: 3, title: '고객 만족도 4.5 이상 유지', progress: 40, notes: '현재 4.2/5.0' },
    ],
    monthly: {
      '2026-03': [
        { id: 1, title: '봄시즌 타임세일 매출 목표 2000만원', progress: 60, notes: '현재 1200만원 달성' },
        { id: 2, title: '신규 고객 50명 유치', progress: 70, notes: '현재 35명 유치 완료' },
        { id: 3, title: '팀 업무관리 시스템 프로토타입 완성', progress: 80, notes: '프로토타입 개발 중' },
      ]
    }
  },
  chatHistory: {},
  _counters: { tasks: 14, meetings: 3, notices: 4, memos: 4, calendarEvents: 20, recurringTasks: 8, yearlyGoals: 3, monthlyGoals: 3 }
};

// ═══════════════════════════════════════
//  JSON DB 클래스
// ═══════════════════════════════════════
class JsonDB {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure new fields exist
        if (!this.data._counters) this.data._counters = DEFAULT_DATA._counters;
        if (!this.data.chatHistory) this.data.chatHistory = {};
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this.save();
        console.log('시드 데이터로 DB 초기화 완료!');
      }
    } catch (e) {
      console.error('DB 로드 실패, 기본 데이터로 초기화:', e.message);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
    }
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  nextId(collection) {
    this.data._counters[collection]++;
    return this.data._counters[collection];
  }
}

const db = new JsonDB(DB_PATH);

module.exports = db;
