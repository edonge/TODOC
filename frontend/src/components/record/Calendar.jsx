import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../api/base';
import './Calendar.css';

// Module-level cache: key = `${kidId}-${year}-${month}`, TTL = 60s
const calendarCache = new Map();
const CALENDAR_CACHE_TTL = 60_000;

function Calendar({ onDateSelect, selectedDate: externalSelectedDate, kidId, refreshKey = 0 }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(externalSelectedDate || null);
  const [recordedDates, setRecordedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const lastRefreshKeyRef = useRef(refreshKey);

  // 월별 기록 데이터 가져오기 (stale-while-revalidate)
  const fetchMonthlyRecords = useCallback(async () => {
    if (!kidId) {
      setRecordedDates({});
      return;
    }

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const cacheKey = `${kidId}-${year}-${month}`;

    // refreshKey 변경 감지 → 강제 갱신
    const refreshKeyChanged = lastRefreshKeyRef.current !== refreshKey;
    lastRefreshKeyRef.current = refreshKey;
    if (refreshKeyChanged) {
      calendarCache.delete(cacheKey);
    }

    const cached = calendarCache.get(cacheKey);
    if (cached) {
      setRecordedDates(cached.dates);
      if (Date.now() - cached.timestamp < CALENDAR_CACHE_TTL) return;
      // TTL 초과: 백그라운드 갱신 (로딩 표시 안 함)
    } else {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await apiFetch(
        `/api/kids/${kidId}/records/monthly/${year}/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const dates = data.dates || {};
        calendarCache.set(cacheKey, { dates, timestamp: Date.now() });
        setRecordedDates(dates);
      }
    } catch (error) {
      console.error('월별 기록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [kidId, currentMonth, refreshKey]);

  useEffect(() => {
    fetchMonthlyRecords();
  }, [fetchMonthlyRecords]);

  // 외부에서 selectedDate가 변경되면 동기화
  useEffect(() => {
    if (externalSelectedDate && externalSelectedDate !== selectedDate) {
      setSelectedDate(externalSelectedDate);
    }
  }, [externalSelectedDate]);

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

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayStr);
    if (onDateSelect) onDateSelect(todayStr);
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
      } else if (!kidId) {
        // kid가 없으면 모든 날짜를 기록 없음으로 표시
        statusClass = 'no-record';
      } else if (hasRecord === true) {
        statusClass = 'recorded';
      } else if (hasRecord === false) {
        statusClass = 'no-record';
      } else {
        // 로딩 중이거나 데이터 없음
        statusClass = loading ? '' : 'no-record';
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
          {selectedDate !== todayStr && (
            <button className="calendar-today-btn" onClick={goToToday}>
              오늘
            </button>
          )}
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
