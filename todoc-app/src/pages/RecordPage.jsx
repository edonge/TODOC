import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/record/Calendar';
import RecordCards from '../components/record/RecordCards';
import RecordCategoryModal from '../components/record/RecordCategoryModal';
import BottomTabBar from '../components/home/BottomTabBar';
import './RecordPage.css';

function RecordPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleAddRecord = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (category) => {
    setShowCategoryModal(false);
    // 카테고리에 따라 해당 페이지로 이동
    if (category.id === 'growth') {
      navigate('/record/growth/add');
    } else if (category.id === 'sleep') {
      navigate('/record/sleep/add');
    } else if (category.id === 'diaper') {
      navigate('/record/diaper/add');
    } else {
      // 다른 카테고리는 아직 미구현
      alert(`${category.name} 기록 추가 페이지는 준비 중입니다.`);
    }
  };

  return (
    <div className="record-page">
      <Calendar
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />

      <div className="record-add-area">
        <button className="record-add-btn" onClick={handleAddRecord}>
          기록 추가하기
        </button>
      </div>

      {/* 기록 카드 목록 */}
      <RecordCards selectedDate={selectedDate} />

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <RecordCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSelectCategory={handleCategorySelect}
        />
      )}

      <BottomTabBar activeTab="일지" />
    </div>
  );
}

export default RecordPage;
