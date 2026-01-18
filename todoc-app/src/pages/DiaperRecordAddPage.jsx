import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import diaperMock from '../assets/categories/배변.png';
import './DiaperRecordAddPage.css';

function DiaperRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: '26.01.26',
    time: '00:00',
    unknownTime: false,
    type: null, // '소변', '대변', '둘다'
    amount: null, // '많음', '보통', '적음'
    condition: null, // '정상', '설사', '변비'
    color: null, // '노랑', '갈색', '초록', '이외'
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
      category: '배변',
      createdAt: new Date().toISOString(),
    };
    console.log('배변 기록 데이터:', recordData);
    alert('배변 기록이 등록되었습니다');
    navigate('/record');
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  return (
    <div className="diaper-add-page">
      {/* 서브 헤더 */}
      <div className="diaper-add-subheader">
        <button className="diaper-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      {/* 카테고리 이미지 */}
      <div className="diaper-category-label">
        <img src={diaperMock} alt="배변" className="diaper-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="diaper-form">
        {/* 날짜 및 시간 */}
        <div className="diaper-form-section">
          <label className="diaper-form-label">날짜 및 시간</label>
          <div className="diaper-datetime-row">
            <input
              type="text"
              className="diaper-form-input diaper-input-date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            <input
              type="text"
              className="diaper-form-input diaper-input-time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              disabled={formData.unknownTime}
            />
            <label className="diaper-checkbox-label">
              <input
                type="checkbox"
                checked={formData.unknownTime}
                onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
              />
              <span>시간 모름</span>
            </label>
          </div>
        </div>

        {/* 종류 */}
        <div className="diaper-form-section">
          <label className="diaper-form-label">종류</label>
          <div className="diaper-option-buttons">
            <button
              type="button"
              className={`diaper-option-btn urine ${formData.type === '소변' ? 'active' : ''}`}
              onClick={() => handleInputChange('type', '소변')}
            >
              소변
            </button>
            <button
              type="button"
              className={`diaper-option-btn stool ${formData.type === '대변' ? 'active' : ''}`}
              onClick={() => handleInputChange('type', '대변')}
            >
              대변
            </button>
            <button
              type="button"
              className={`diaper-option-btn both ${formData.type === '둘다' ? 'active' : ''}`}
              onClick={() => handleInputChange('type', '둘다')}
            >
              둘다
            </button>
          </div>
        </div>

        {/* 양 */}
        <div className="diaper-form-section">
          <label className="diaper-form-label">양</label>
          <div className="diaper-option-buttons">
            <button
              type="button"
              className={`diaper-option-btn amount ${formData.amount === '많음' ? 'active' : ''}`}
              onClick={() => handleInputChange('amount', '많음')}
            >
              많음
            </button>
            <button
              type="button"
              className={`diaper-option-btn amount ${formData.amount === '보통' ? 'active' : ''}`}
              onClick={() => handleInputChange('amount', '보통')}
            >
              보통
            </button>
            <button
              type="button"
              className={`diaper-option-btn amount ${formData.amount === '적음' ? 'active' : ''}`}
              onClick={() => handleInputChange('amount', '적음')}
            >
              적음
            </button>
          </div>
        </div>

        {/* 상태 */}
        <div className="diaper-form-section">
          <label className="diaper-form-label">상태</label>
          <div className="diaper-option-buttons">
            <button
              type="button"
              className={`diaper-option-btn condition ${formData.condition === '정상' ? 'active' : ''}`}
              onClick={() => handleInputChange('condition', '정상')}
            >
              정상
            </button>
            <button
              type="button"
              className={`diaper-option-btn condition ${formData.condition === '설사' ? 'active' : ''}`}
              onClick={() => handleInputChange('condition', '설사')}
            >
              설사
            </button>
            <button
              type="button"
              className={`diaper-option-btn condition ${formData.condition === '변비' ? 'active' : ''}`}
              onClick={() => handleInputChange('condition', '변비')}
            >
              변비
            </button>
          </div>
        </div>

        {/* 색깔 */}
        <div className="diaper-form-section">
          <label className="diaper-form-label">색깔</label>
          <div className="diaper-option-buttons">
            <button
              type="button"
              className={`diaper-option-btn color-yellow ${formData.color === '노랑' ? 'active' : ''}`}
              onClick={() => handleInputChange('color', '노랑')}
            >
              노랑
            </button>
            <button
              type="button"
              className={`diaper-option-btn color-brown ${formData.color === '갈색' ? 'active' : ''}`}
              onClick={() => handleInputChange('color', '갈색')}
            >
              갈색
            </button>
            <button
              type="button"
              className={`diaper-option-btn color-green ${formData.color === '초록' ? 'active' : ''}`}
              onClick={() => handleInputChange('color', '초록')}
            >
              초록
            </button>
            <button
              type="button"
              className={`diaper-option-btn color-other ${formData.color === '이외' ? 'active' : ''}`}
              onClick={() => handleInputChange('color', '이외')}
            >
              이외
            </button>
          </div>
        </div>

        {/* 메모 */}
        <div className="diaper-form-section memo-section">
          <label className="diaper-form-label">메모</label>
          <textarea
            className="diaper-form-textarea"
            placeholder="내용을 입력하세요"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            rows={4}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="diaper-form-buttons">
          <button
            type="button"
            className="diaper-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="diaper-cancel-btn"
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

export default DiaperRecordAddPage;
