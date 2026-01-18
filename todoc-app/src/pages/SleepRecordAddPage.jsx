import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import sleepMock from '../assets/categories/수면.png';
import './SleepRecordAddPage.css';

function SleepRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: '26.01.26',
    sleepType: null, // '낮잠' or '밤잠'
    startDate: '26.01.26',
    startTime: '00:00',
    endDate: '26.01.26',
    endTime: '00:00',
    quality: null, // '좋음', '보통', '나쁨'
    memo: '',
  });

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 등록하기
  const handleSubmit = () => {
    const recordData = {
      ...formData,
      category: '수면',
      createdAt: new Date().toISOString(),
    };
    console.log('수면 기록 데이터:', recordData);
    alert('수면 기록이 등록되었습니다');
    navigate('/record');
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  return (
    <div className="sleep-add-page">
      {/* 서브 헤더 */}
      <div className="sleep-add-subheader">
        <button className="sleep-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      {/* 카테고리 이미지 */}
      <div className="sleep-category-label">
        <img src={sleepMock} alt="수면" className="sleep-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="sleep-form">
        {/* 날짜 & 종류 */}
        <div className="sleep-form-row">
          <div className="sleep-form-group">
            <label className="sleep-form-label">날짜</label>
            <input
              type="text"
              className="sleep-form-input sleep-input-date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div className="sleep-form-group">
            <label className="sleep-form-label">종류</label>
            <div className="sleep-type-buttons">
            <button
              type="button"
              className={`sleep-type-btn ${formData.sleepType === '낮잠' ? 'active' : ''}`}
              onClick={() => handleInputChange('sleepType', '낮잠')}
            >
              낮잠
            </button>
            <button
              type="button"
              className={`sleep-type-btn night ${formData.sleepType === '밤잠' ? 'active' : ''}`}
              onClick={() => handleInputChange('sleepType', '밤잠')}
            >
              밤잠
            </button>
            </div>
          </div>
        </div>

        {/* 시작 시간 */}
        <div className="sleep-form-section">
          <label className="sleep-form-label">시작 시간</label>
          <div className="sleep-time-row">
            <input
              type="text"
              className="sleep-form-input sleep-input-date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
            />
            <input
              type="text"
              className="sleep-form-input sleep-input-time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
          </div>
        </div>

        {/* 종료 시간 */}
        <div className="sleep-form-section">
          <label className="sleep-form-label">종료 시간</label>
          <div className="sleep-time-row">
            <input
              type="text"
              className="sleep-form-input sleep-input-date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
            />
            <input
              type="text"
              className="sleep-form-input sleep-input-time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
          </div>
        </div>

        {/* 수면 품질 */}
        <div className="sleep-form-section">
          <label className="sleep-form-label">수면 품질</label>
          <div className="sleep-quality-buttons">
            <button
              type="button"
              className={`sleep-quality-btn good ${formData.quality === '좋음' ? 'active' : ''}`}
              onClick={() => handleInputChange('quality', '좋음')}
            >
              좋음
            </button>
            <button
              type="button"
              className={`sleep-quality-btn normal ${formData.quality === '보통' ? 'active' : ''}`}
              onClick={() => handleInputChange('quality', '보통')}
            >
              보통
            </button>
            <button
              type="button"
              className={`sleep-quality-btn bad ${formData.quality === '나쁨' ? 'active' : ''}`}
              onClick={() => handleInputChange('quality', '나쁨')}
            >
              나쁨
            </button>
          </div>
        </div>

        {/* 메모 */}
        <div className="sleep-form-section memo-section">
          <label className="sleep-form-label">메모</label>
          <textarea
            className="sleep-form-textarea"
            placeholder="내용을 입력하세요"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            rows={4}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="sleep-form-buttons">
          <button
            type="button"
            className="sleep-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="sleep-cancel-btn"
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

export default SleepRecordAddPage;
