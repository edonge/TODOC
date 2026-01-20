import { useState } from 'react';
import './Calendar.css';

// 더미 기록 데이터 생성 함수
const generateDummyRecords = (year, month, today) => {
  const records = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 미래 날짜는 기록 없음
    if (date > today) {
      continue;
    }

    // 과거 날짜는 고정된 8:2 비율로 파란/빨간 설정 (날짜 기반)
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) % 1000;
    }
    records[dateStr] = hash % 10 < 2 ? false : true;
  }

  return records;
};

function Calendar({ onDateSelect, selectedDate: externalSelectedDate }) {
  const today = new Date(2026, 0, 26);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // 2026년 1월
  const [selectedDate, setSelectedDate] = useState(externalSelectedDate || null);

  // 현재 월의 더미 기록 데이터
  const recordedDates = generateDummyRecords(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    today
  );

  // 월 이동
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  // 캘린더 그리드 생성
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 해당 월의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 첫 날의 요일 (월요일 = 0으로 조정)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const daysInMonth = lastDay.getDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells = [];

    // 빈 셀 추가 (월 시작 전)
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // 날짜 셀 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month, day);
      const isFuture = date > today;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const hasRecord = recordedDates[dateStr];

      let statusClass = '';
      if (isFuture) {
        statusClass = 'future';
      } else if (hasRecord === true) {
        statusClass = 'recorded';
      } else if (hasRecord === false) {
        statusClass = 'no-record';
      } else {
        statusClass = 'future'; // 기록 정보 없으면 미래처럼 처리
      }

      cells.push(
        <div
          key={dateStr}
          className={`calendar-cell ${statusClass} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => !isFuture && handleDateClick(dateStr)}
        >
          <span className="calendar-day">{day}</span>
        </div>
      );
    }

    return cells;
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="calendar-container">
      {/* 월 네비게이션 */}
      <div className="calendar-header">
        <span className="calendar-month-title">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </span>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={goToPrevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="calendar-dates">
        {/* 요일 헤더 */}
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="calendar-grid">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
