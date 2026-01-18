import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import growthMock from '../assets/categories/성장.png';
import './GrowthRecordAddPage.css';

function GrowthRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: '26.01.26',
    height: '',
    weight: '',
    headCircumference: '',
    memo: '',
  });

  // 활동 태그 상태
  const [activities, setActivities] = useState([]);
  const availableActivities = ['독서', '산책', '목욕', '놀이', '음악'];
  const [activityIndex, setActivityIndex] = useState(0);

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 활동 추가
  const handleAddActivity = () => {
    if (activityIndex < availableActivities.length) {
      const newActivity = availableActivities[activityIndex];
      if (!activities.includes(newActivity)) {
        setActivities([...activities, newActivity]);
        setActivityIndex(prev => prev + 1);
      }
    }
  };

  // 등록하기
  const handleSubmit = () => {
    const recordData = {
      ...formData,
      activities,
      category: '성장',
      createdAt: new Date().toISOString(),
    };
    console.log('성장 기록 데이터:', recordData);
    alert('성장 기록이 등록되었습니다');
    navigate('/record');
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  return (
    <div className="growth-add-page">
      {/* 서브 헤더 */}
      <div className="growth-add-subheader">
        <button className="growth-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      <div className="growth-category-label">
        <img src={growthMock} alt="성장" className="growth-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="growth-form">
        {/* 날짜 & 키 */}
        <div className="growth-form-row">
          <div className="growth-form-group">
            <label className="growth-form-label">날짜</label>
            <input
              type="text"
              className="growth-form-input growth-input-date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div className="growth-form-group">
            <label className="growth-form-label">키</label>
            <div className="growth-input-with-unit height">
              <input
                type="text"
                className="growth-form-input growth-input-height"
                placeholder="00.00"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
              <span className="growth-unit">cm</span>
            </div>
          </div>
        </div>

        {/* 몸무게 & 머리 둘레 */}
        <div className="growth-form-row">
          <div className="growth-form-group">
            <label className="growth-form-label">몸무게</label>
            <div className="growth-input-with-unit weight">
              <input
                type="text"
                className="growth-form-input growth-input-weight"
                placeholder="00.00"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
              <span className="growth-unit">kg</span>
            </div>
          </div>
          <div className="growth-form-group">
            <label className="growth-form-label">머리 둘레</label>
            <div className="growth-input-with-unit head">
              <input
                type="text"
                className="growth-form-input growth-input-head"
                placeholder="00.00"
                value={formData.headCircumference}
                onChange={(e) => handleInputChange('headCircumference', e.target.value)}
              />
              <span className="growth-unit">cm</span>
            </div>
          </div>
        </div>

        {/* 활동 */}
        <div className="growth-form-section">
          <label className="growth-form-label">활동</label>
          <div className="growth-activities">
            {activities.map((activity, index) => (
              <span key={index} className="growth-activity-tag active">
                {activity}
              </span>
            ))}
            <button
              type="button"
              className="growth-add-activity-btn"
              onClick={handleAddActivity}
            >
              + 활동 추가
            </button>
          </div>
        </div>

        {/* 메모 */}
        <div className="growth-form-section memo-section">
          <label className="growth-form-label">메모</label>
          <textarea
            className="growth-form-textarea"
            placeholder="내용을 입력하세요"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            rows={4}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="growth-form-buttons">
          <button
            type="button"
            className="growth-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="growth-cancel-btn"
            onClick={handleCancel}
          >
            취소
          </button>
        </div>
      </div>

      <BottomTabBar activeTab="일지" />
    </div>
  );
}

export default GrowthRecordAddPage;
