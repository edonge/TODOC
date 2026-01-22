import DiaperCard from './DiaperCard';
import EtcCard from './EtcCard';
import SleepCard from './SleepCard';
import GrowthCard from './GrowthCard';
import MealCard from './MealCard';
import HealthCard from './HealthCard';
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
      headCircumference: { value: 42.5, change: '+0.3' },
      activities: ['독서', '걷기'],
    },
    meal: {
      totalCount: 5,
      records: [
        { time: '18:30', type: '모유', amount: '15분', burp: '트림 O' },
        { time: '15:00', type: '모유', amount: '15분', burp: '트림 X' },
        { time: '10:00', type: '수유', amount: '120ml', burp: '트림 O' },
        { time: '06:30', type: '모유', amount: '15분', burp: '트림 X' },
        { time: '03:00', type: '이유식', amount: '50g', burp: '트림 O' },
      ],
    },
    health: {
      lastRecord: '2일 전',
      note: '감기 걸려서 병원 갔다옴 ㅠㅠ',
      date: '26.01.24',
      symptoms: ['열', '기침', '콧물'],
      medicine: ['이부프로펜'],
      records: [
        {
          title: '감기 걸려서 병원 갔다옴 ㅠㅠ',
          date: '26.01.24',
          tags: ['열', '기침', '콧물', '이부프로펜'],
        },
        {
          title: '밤새 열이 올라 해열제 복용',
          date: '26.01.23',
          tags: ['열', '해열제'],
        },
      ],
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
        { time: '17:00', type: '모유', amount: '20분', burp: '트림 O' },
        { time: '12:00', type: '수유', amount: '100ml', burp: '트림 X' },
        { time: '07:00', type: '모유', amount: '15분', burp: '트림 O' },
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
      headCircumference: { value: 42.2, change: '+0.2' },
      activities: ['목욕', '음악'],
    },
    meal: {
      totalCount: 5,
      records: [
        { time: '20:00', type: '모유', amount: '15분', burp: '트림 O' },
        { time: '16:00', type: '모유', amount: '20분', burp: '트림 X' },
        { time: '12:00', type: '수유', amount: '150ml', burp: '트림 O' },
        { time: '08:00', type: '모유', amount: '15분', burp: '트림 X' },
        { time: '04:00', type: '모유', amount: '10분', burp: '트림 O' },
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
  const data = dummyData[selectedDate] || dummyData['2026-01-26'];

  return (
    <div className="record-cards-container">
      {/* 수면 카드 */}
      {data.sleep && (
        <SleepCard records={data.sleep.records} />
      )}

      {/* 성장 카드 */}
      <GrowthCard data={data.growth} />

      {/* 식사 카드 */}
      <MealCard records={data.meal?.records || []} />

      {/* 건강 카드 */}
      <HealthCard data={data.health} />

      {/* 배변 카드 */}
      <DiaperCard data={data.diaper} />

      {/* 기타 카드 */}
      <EtcCard data={data.etc} />
    </div>
  );
}

export default RecordCards;
