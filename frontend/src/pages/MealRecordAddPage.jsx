import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import mealMock from '../assets/categories/식사.png';
import './MealRecordAddPage.css';

function MealRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: '26.01.26',
    hour: '00',
    minute: '00',
    unknownTime: false,
    duration: '15',
    foodType: null,
    foodDetail: '',
    amount: '',
    amountMl: '100',
    burpinh: false,
  });

  // 드롭다운 상태
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showFoodTypeDropdown, setShowFoodTypeDropdown] = useState(false);
  const [showAmountMlDropdown, setShowAmountMlDropdown] = useState(false);

  // 드롭다운 ref
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const durationRef = useRef(null);
  const foodTypeRef = useRef(null);
  const amountMlRef = useRef(null);

  // 옵션들
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const durations = Array.from({ length: 61 }, (_, i) => String(i));
  const foodTypes = ['간식', '모유', '분유', '젖병', '이유식', '기타'];
  const amountMlOptions = Array.from({ length: 50 }, (_, i) => String((i + 1) * 10));

  // 음식 유형에 따른 UI 결정
  const needsDetailInput = ['간식', '젖병', '이유식', '기타'].includes(formData.foodType);
  const needsMlAmount = ['젖병', '이유식', '분유'].includes(formData.foodType);
  const needsTextAmount = ['간식', '기타'].includes(formData.foodType);
  const isBreastMilk = formData.foodType === '모유';

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hourRef.current && !hourRef.current.contains(e.target)) {
        setShowHourDropdown(false);
      }
      if (minuteRef.current && !minuteRef.current.contains(e.target)) {
        setShowMinuteDropdown(false);
      }
      if (durationRef.current && !durationRef.current.contains(e.target)) {
        setShowDurationDropdown(false);
      }
      if (foodTypeRef.current && !foodTypeRef.current.contains(e.target)) {
        setShowFoodTypeDropdown(false);
      }
      if (amountMlRef.current && !amountMlRef.current.contains(e.target)) {
        setShowAmountMlDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 음식 유형 선택
  const handleFoodTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      foodType: type,
      foodDetail: '',
      amount: '',
      amountMl: '100',
    }));
    setShowFoodTypeDropdown(false);
  };

  // 등록하기
  const handleSubmit = () => {
    const recordData = {
      ...formData,
      time: `${formData.hour}:${formData.minute}`,
      category: '식사',
      createdAt: new Date().toISOString(),
    };
    console.log('식사 기록 데이터:', recordData);
    alert('식사 기록이 등록되었습니다');
    navigate('/record');
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  return (
    <div className="meal-add-page">
      {/* 서브 헤더 */}
      <div className="meal-add-subheader">
        <button className="meal-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      {/* 카테고리 이미지 */}
      <div className="meal-category-label">
        <img src={mealMock} alt="식사" className="meal-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="meal-form">
        {/* 날짜 및 시간 */}
        <div className="meal-form-section">
          <label className="meal-form-label">날짜 및 시간</label>
          <div className="meal-datetime-row">
            <input
              type="text"
              className="meal-form-input meal-input-date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />

            {/* 시간 드롭다운 */}
            <div className="meal-time-dropdown-container" ref={hourRef}>
              <button
                type="button"
                className={`meal-time-select ${formData.unknownTime ? 'disabled' : ''} ${!formData.unknownTime && formData.hour !== '00' ? 'selected' : ''}`}
                onClick={() => !formData.unknownTime && setShowHourDropdown(!showHourDropdown)}
                disabled={formData.unknownTime}
              >
                {formData.hour}
              </button>
              {showHourDropdown && (
                <div className="meal-dropdown-menu time-dropdown">
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`meal-dropdown-item ${formData.hour === hour ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('hour', hour);
                        setShowHourDropdown(false);
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="meal-time-separator">:</span>

            {/* 분 드롭다운 */}
            <div className="meal-time-dropdown-container" ref={minuteRef}>
              <button
                type="button"
                className={`meal-time-select ${formData.unknownTime ? 'disabled' : ''} ${!formData.unknownTime && formData.minute !== '00' ? 'selected' : ''}`}
                onClick={() => !formData.unknownTime && setShowMinuteDropdown(!showMinuteDropdown)}
                disabled={formData.unknownTime}
              >
                {formData.minute}
              </button>
              {showMinuteDropdown && (
                <div className="meal-dropdown-menu time-dropdown">
                  {minutes.map(minute => (
                    <div
                      key={minute}
                      className={`meal-dropdown-item ${formData.minute === minute ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('minute', minute);
                        setShowMinuteDropdown(false);
                      }}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="meal-checkbox-label">
              <input
                type="checkbox"
                checked={formData.unknownTime}
                onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
              />
              <span className="meal-checkbox-custom">
                {formData.unknownTime && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="#A89680" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span>모름</span>
            </label>
          </div>
        </div>

        {/* 식사 시간 (분) */}
        <div className="meal-form-section">
          <label className="meal-form-label">식사 시간</label>
          <div className="meal-duration-row">
            <div className="meal-dropdown-container" ref={durationRef}>
              <button
                type="button"
                className={`meal-select-btn ${formData.duration !== '15' ? 'selected' : ''}`}
                onClick={() => setShowDurationDropdown(!showDurationDropdown)}
              >
                {formData.duration}
              </button>
              {showDurationDropdown && (
                <div className="meal-dropdown-menu duration-dropdown">
                  {durations.map(d => (
                    <div
                      key={d}
                      className={`meal-dropdown-item ${formData.duration === d ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('duration', d);
                        setShowDurationDropdown(false);
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="meal-unit">분</span>
          </div>
        </div>

        {/* 음식 유형 */}
        <div className="meal-form-section">
          <label className="meal-form-label">음식 유형</label>
          <div className="meal-dropdown-container" ref={foodTypeRef}>
            <button
              type="button"
              className={`meal-select-btn food-type ${formData.foodType ? 'selected' : ''}`}
              onClick={() => setShowFoodTypeDropdown(!showFoodTypeDropdown)}
            >
              {formData.foodType || '선택'}
            </button>
            {showFoodTypeDropdown && (
              <div className="meal-dropdown-menu food-type-dropdown">
                {foodTypes.map(type => (
                  <div
                    key={type}
                    className={`meal-dropdown-item ${formData.foodType === type ? 'selected' : ''}`}
                    onClick={() => handleFoodTypeSelect(type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 종류 (조건부) */}
        {needsDetailInput && (
          <div className="meal-form-section">
            <label className="meal-form-label">종류</label>
            <input
              type="text"
              className="meal-form-input meal-input-detail"
              placeholder="종류를 입력하세요"
              value={formData.foodDetail}
              onChange={(e) => handleInputChange('foodDetail', e.target.value)}
            />
          </div>
        )}

        {/* 양 */}
        <div className="meal-form-section">
          <label className="meal-form-label">양</label>
          {isBreastMilk ? (
            <div className="meal-na-text">N/A (모유)</div>
          ) : needsMlAmount ? (
            <div className="meal-amount-row">
              <div className="meal-dropdown-container" ref={amountMlRef}>
                <button
                  type="button"
                  className="meal-select-btn"
                  onClick={() => setShowAmountMlDropdown(!showAmountMlDropdown)}
                >
                  {formData.amountMl}
                </button>
                {showAmountMlDropdown && (
                  <div className="meal-dropdown-menu amount-dropdown">
                    {amountMlOptions.map(ml => (
                      <div
                        key={ml}
                        className={`meal-dropdown-item ${formData.amountMl === ml ? 'selected' : ''}`}
                        onClick={() => {
                          handleInputChange('amountMl', ml);
                          setShowAmountMlDropdown(false);
                        }}
                      >
                        {ml}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="meal-unit">ml</span>
            </div>
          ) : needsTextAmount ? (
            <input
              type="text"
              className="meal-form-input meal-input-amount"
              placeholder="양을 입력하세요"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
          ) : (
            <div className="meal-na-text">음식 유형을 먼저 선택하세요</div>
          )}
        </div>

        {/* 트림 체크 */}
        <div className="meal-form-section">
          <label className="meal-checkbox-row">
            <input
              type="checkbox"
              checked={formData.burpinh}
              onChange={(e) => handleInputChange('burpinh', e.target.checked)}
            />
            <span className="meal-checkbox-custom large">
              {formData.burpinh && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 8" stroke="#A89680" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="meal-checkbox-text">트림을 했어요</span>
          </label>
        </div>

        {/* 버튼 영역 */}
        <div className="meal-form-buttons">
          <button
            type="button"
            className="meal-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="meal-cancel-btn"
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

export default MealRecordAddPage;
