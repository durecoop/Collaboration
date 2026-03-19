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
  tasks: [],
  meetings: [],
  notices: [],
  memos: [],
  calendarEvents: [],
  recurringTasks: [],
  teamGoals: {
    yearly: [],
    monthly: {}
  },
  chatHistory: {},
  _counters: { tasks: 0, meetings: 0, notices: 0, memos: 0, calendarEvents: 0, recurringTasks: 0, yearlyGoals: 0, monthlyGoals: 0 }
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
