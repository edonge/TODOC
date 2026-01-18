import { useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import './RecordCards.css';

// 날짜별 더미 데이터
const dummyData = {
  '2026-01-26': {
    sleep: {
      totalHours: 11,
      records: [
        { type: '밤잠', start: '22:00', end: '05:00', duration: '7h', color: '#328B6D' },
        { type: '낮잠', start: '12:00', end: '04:00', duration: '4h', color: '#E8D5A3' },
      ],
    },
    growth: {
      lastRecord: '2일 전',
      height: { value: 65.2, change: '+0.8' },
      weight: { value: 7.4, change: '-0.3' },
      activities: ['독서', '걷기'],
    },
    meal: {
      totalCount: 4,
      records: [
        { time: '18:30', type: '모유', amount: '15분' },
        { time: '15:00', type: '모유', amount: '15분' },
        { time: '10:00', type: '수유', amount: '120ml' },
        { time: '06:30', type: '모유', amount: '15분' },
      ],
    },
    health: {
      lastRecord: '2일 전',
      note: '감기 걸려서 병원 갔다옴 ㅠㅠ',
      date: '26.01.24',
      symptoms: ['열', '기침', '콧물'],
      medicine: ['이부프로펜'],
    },
    diaper: {
      lastRecord: '2시간 전',
      records: [
        { time: '18:00', type: '대변', condition: '설사', color: '#328B6D' },
        { time: '14:00', type: '대소변', condition: '정상', color: '#4B3131' },
      ],
    },
    etc: {
      records: [
        { date: '01.23', text: '처음으로 걸은 날!' },
        { date: '01.19', text: '젖몸살 때문에 쉬는날..' },
      ],
    },
  },
  '2026-01-22': {
    sleep: {
      totalHours: 9,
      records: [
        { type: '밤잠', start: '21:00', end: '06:00', duration: '9h', color: '#328B6D' },
      ],
    },
    growth: null,
    meal: {
      totalCount: 3,
      records: [
        { time: '17:00', type: '모유', amount: '20분' },
        { time: '12:00', type: '수유', amount: '100ml' },
        { time: '07:00', type: '모유', amount: '15분' },
      ],
    },
    health: null,
    diaper: {
      lastRecord: '5시간 전',
      records: [
        { time: '15:00', type: '소변', condition: '정상', color: '#E8D5A3' },
      ],
    },
    etc: null,
  },
  '2026-01-01': {
    sleep: {
      totalHours: 12,
      records: [
        { type: '밤잠', start: '20:00', end: '07:00', duration: '11h', color: '#328B6D' },
        { type: '낮잠', start: '13:00', end: '14:00', duration: '1h', color: '#E8D5A3' },
      ],
    },
    growth: {
      lastRecord: '오늘',
      height: { value: 64.4, change: '+0.5' },
      weight: { value: 7.7, change: '+0.2' },
      activities: ['목욕', '음악'],
    },
    meal: {
      totalCount: 5,
      records: [
        { time: '20:00', type: '모유', amount: '15분' },
        { time: '16:00', type: '모유', amount: '20분' },
        { time: '12:00', type: '수유', amount: '150ml' },
        { time: '08:00', type: '모유', amount: '15분' },
        { time: '04:00', type: '모유', amount: '10분' },
      ],
    },
    health: null,
    diaper: {
      lastRecord: '1시간 전',
      records: [
        { time: '19:00', type: '대변', condition: '정상', color: '#4B3131' },
        { time: '14:00', type: '소변', condition: '정상', color: '#E8D5A3' },
        { time: '09:00', type: '대소변', condition: '정상', color: '#4B3131' },
      ],
    },
    etc: {
      records: [
        { date: '01.01', text: '새해 첫날! 🎉' },
      ],
    },
  },
};

function RecordCards({ selectedDate }) {
  const [openMenu, setOpenMenu] = useState(null);

  const data = dummyData[selectedDate] || dummyData['2026-01-26'];

  const handleMenuToggle = (cardId) => {
    setOpenMenu(openMenu === cardId ? null : cardId);
  };

  const handleMenuAction = (action, category) => {
    alert(`${category} ${action}`);
    setOpenMenu(null);
  };

  // 메뉴 드롭다운 컴포넌트
  const MenuDropdown = ({ cardId, category }) => (
    <div className="record-card-menu">
      <button
        className="menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          handleMenuToggle(cardId);
        }}
      >
        <img src={moreIcon} alt="더보기" className="menu-icon" />
      </button>
      {openMenu === cardId && (
        <div className="menu-dropdown">
          <button onClick={() => handleMenuAction('수정하기', category)}>수정하기</button>
          <button onClick={() => handleMenuAction('삭제하기', category)}>삭제하기</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="record-cards-container" onClick={() => setOpenMenu(null)}>
      {/* 수면 카드 */}
      {data.sleep && (
        <div className="record-card sleep-card">
          <div className="record-card-label sleep">수면</div>
          <div className="record-card-content">
            <div className="record-card-header">
              <span className="header-text">오늘의 수면 : {data.sleep.totalHours}시간</span>
              <MenuDropdown cardId="sleep" category="수면" />
            </div>
            <div className="sleep-records-wrapper">
              <div className="sleep-records">
                {data.sleep.records.map((record, idx) => (
                  <div
                    key={idx}
                    className={`sleep-record-item ${record.type === '밤잠' ? 'night' : 'day'}`}
                  >
                    <span className="sleep-type-label">{record.type}</span>
                    <span className="sleep-time">{record.start} - {record.end}</span>
                    <span className="sleep-duration">{record.duration}</span>
                    <span className="sleep-dot" style={{ backgroundColor: record.color }}></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 성장 카드 */}
      {data.growth && (
        <div className="record-card growth-card">
          <div className="record-card-label growth">성장</div>
          <div className="record-card-content growth-content">
            <div className="record-card-header">
              <div className="header-inline">
                <span className="header-text-plain">최근 성장 기록</span>
                <span className="header-sub">마지막 기록 : {data.growth.lastRecord}</span>
              </div>
              <MenuDropdown cardId="growth" category="성장" />
            </div>
            <div className="growth-info-wrapper">
              <div className="growth-info">
                <div className="growth-stats">
                <div className="growth-stat-item">
                  <span className="stat-value">
                    <span className="stat-label">키</span>
                    {data.growth.height.value} cm
                    <span className={`stat-change ${data.growth.height.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      ({data.growth.height.change})
                    </span>
                  </span>
                </div>
                <div className="growth-stat-item">
                  <span className="stat-value">
                    <span className="stat-label">몸무게</span>
                    {data.growth.weight.value} kg
                    <span className={`stat-change ${data.growth.weight.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      ({data.growth.weight.change})
                    </span>
                  </span>
                </div>
                </div>
                <div className="growth-activities">
                  <span className="activities-label">활동</span>
                  <div className="activity-tags">
                    {data.growth.activities.map((activity, idx) => (
                      <span key={idx} className="activity-tag">{activity}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 식사 카드 */}
      {data.meal && (
        <div className="record-card meal-card">
          <div className="record-card-label meal">식사</div>
          <div className="record-card-content">
            <div className="record-card-header">
              <span className="header-text meal-header-text">오늘의 식사 : 총 {data.meal.totalCount}회</span>
              <MenuDropdown cardId="meal" category="식사" />
            </div>
            <div className="meal-records">
              {data.meal.records.map((record, idx) => (
                <div key={idx} className="meal-record-item">
                  <span className="meal-time">{record.time}</span>
                  <span className="meal-type">{record.type}</span>
                  <span className="meal-amount">{record.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 건강 카드 */}
      {data.health && (
        <div className="record-card health-card">
          <div className="record-card-label health">건강</div>
          <div className="record-card-content">
            <div className="record-card-header">
              <div className="header-inline">
                <span className="header-text-plain">최근 건강 기록</span>
                <span className="header-sub">마지막 기록 : {data.health.lastRecord}</span>
              </div>
              <MenuDropdown cardId="health" category="건강" />
            </div>
            <div className="health-info">
              <div className="health-note-row">
                <span className="health-note">{data.health.note}</span>
                <span className="health-date">{data.health.date}</span>
              </div>
              <div className="health-tags">
                {data.health.symptoms.map((symptom, idx) => (
                  <span key={idx} className="health-tag symptom">{symptom}</span>
                ))}
                {data.health.medicine.map((med, idx) => (
                  <span key={idx} className="health-tag medicine">{med}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 배변 카드 */}
      {data.diaper && (
        <div className="record-card diaper-card">
          <div className="record-card-label diaper">배변</div>
          <div className="record-card-content">
            <div className="record-card-header">
              <div className="header-inline">
                <span className="header-text-plain">최근 배변 기록</span>
                <span className="header-sub">마지막 기록 : {data.diaper.lastRecord}</span>
              </div>
              <MenuDropdown cardId="diaper" category="배변" />
            </div>
            <div className="diaper-records">
              {data.diaper.records.map((record, idx) => (
                <div key={idx} className="diaper-record-item">
                  <span className="diaper-time">{record.time}</span>
                  <span className="diaper-type">{record.type}</span>
                  <span className="diaper-condition">{record.condition}</span>
                  <span className="diaper-dot" style={{ backgroundColor: record.color }}></span>
                  <button className="diaper-menu-btn">•••</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 기타 카드 */}
      {data.etc && (
        <div className="record-card etc-card">
          <div className="record-card-label etc">기타</div>
          <div className="record-card-content">
            <div className="etc-records">
              {data.etc.records.map((record, idx) => (
                <div key={idx} className="etc-record-item">
                  <span className="etc-date">{record.date}</span>
                  <span className="etc-text">{record.text}</span>
                  <button className="etc-menu-btn">•••</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordCards;
