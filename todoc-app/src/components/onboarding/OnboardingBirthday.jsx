import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './OnboardingBirthday.css';

function OnboardingBirthday({ onNext, onBack, childName, initialDate = null }) {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const handleSubmit = () => {
    if (selectedDate) {
      onNext(selectedDate);
    }
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return format(date, 'yyyy년 M월 d일', { locale: ko });
  };

  return (
    <div className="birthday-container">
      {/* 뒤로가기 버튼 */}
      <button className="back-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 헤더 영역 */}
      <div className="birthday-header">
        <h1 className="birthday-title">
          우리 {childName || '아이'},<br />
          세상에 내려온 날은 언제인가요?
        </h1>
        <p className="birthday-subtitle">
          정확하지 않아도 괜찮아요.<br />
          나중에 언제든 수정할 수 있어요.
        </p>
      </div>

      {/* 선택된 날짜 표시 */}
      <div className="selected-date-display">
        <span className="selected-date-text">
          {selectedDate ? formatDisplayDate(selectedDate) : '날짜를 선택해주세요'}
        </span>
      </div>

      {/* 다음 버튼 */}
      <div className="birthday-button-wrapper">
        <button
          className={`next-button ${selectedDate ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
          disabled={!selectedDate}
        >
          다음
        </button>
      </div>

      {/* 캘린더 영역 */}
      <div className="calendar-wrapper">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          locale={ko}
          maxDate={new Date()}
          inline
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          calendarClassName="todoc-calendar"
        />
      </div>
    </div>
  );
}

export default OnboardingBirthday;
