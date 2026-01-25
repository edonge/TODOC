import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import Calendar from '../components/record/Calendar';
import RecordCards from '../components/record/RecordCards';
import RecordCategoryModal from '../components/record/RecordCategoryModal';
import BottomTabBar from '../components/home/BottomTabBar';
import './RecordPage.css';

function RecordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [kidId, setKidId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 아이 정보 가져오기
  useEffect(() => {
    const fetchKidInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/kids', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.kids && data.kids.length > 0) {
            setKidId(data.kids[0].id);
          }
        }
      } catch (error) {
        console.error('아이 정보 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKidInfo();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      setRefreshKey(Date.now());
    }
  }, [location.state]);

  const handleDateSelect = useCallback((dateStr) => {
    setSelectedDate(dateStr);
  }, []);

  const handleAddRecord = () => {
    if (!kidId) {
      alert('먼저 아이를 등록해주세요.');
      return;
    }
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (category) => {
    setShowCategoryModal(false);
    const dateParam = selectedDate ? `?date=${selectedDate}` : '';

    if (category.id === 'growth') {
      navigate(`/record/growth/add${dateParam}`);
    } else if (category.id === 'sleep') {
      navigate(`/record/sleep/add${dateParam}`);
    } else if (category.id === 'diaper') {
      navigate(`/record/diaper/add${dateParam}`);
    } else if (category.id === 'etc') {
      navigate(`/record/etc/add${dateParam}`);
    } else if (category.id === 'health') {
      navigate(`/record/health/add${dateParam}`);
    } else if (category.id === 'meal') {
      navigate(`/record/meal/add${dateParam}`);
    } else {
      alert(`${category.name} 기록 추가 페이지는 준비 중입니다.`);
    }
  };

  if (loading) {
    return (
      <div className="record-page">
        <div className="loading-message">로딩 중...</div>
        <BottomTabBar activeTab="일지" />
      </div>
    );
  }

  return (
    <div className="record-page">
      <Calendar
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        kidId={kidId}
      />

      <div className="record-add-area">
        <button className="record-add-btn" onClick={handleAddRecord}>
          기록 추가하기
        </button>
      </div>

      {/* 기록 카드 목록 */}
      <RecordCards selectedDate={selectedDate} kidId={kidId} refreshKey={refreshKey} />

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
