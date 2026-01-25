import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import mealMock from '../assets/categories/식사.png';
import './MealRecordAddPage.css';

// 프론트엔드 -> 백엔드 음식 유형 매핑
const foodTypeToEnum = {
  '모유': 'breast_milk',
  '분유': 'formula',
  '젖병': 'bottle',
  '이유식': 'baby_food',
  '간식': 'snack',
  '기타': 'other',
};

function MealRecordAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editRecord = location.state?.record || null;
  const isEdit = Boolean(editRecord);
  const dateParam = searchParams.get('date');

  // 오늘 날짜 기본값
  const getDefaultDate = () => {
    if (dateParam) {
      const parts = dateParam.split('-');
      if (parts.length === 3) {
        return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
      }
    }
    const today = new Date();
    const yy = String(today.getFullYear()).slice(2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
  };

  const getDefaultTime = () => {
    const now = new Date();
    return {
      hour: String(now.getHours()).padStart(2, '0'),
      minute: String(now.getMinutes()).padStart(2, '0'),
    };
  };

  const defaultTime = getDefaultTime();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: getDefaultDate(),
    hour: defaultTime.hour,
    minute: defaultTime.minute,
    unknownTime: false,
    duration: '15',
    foodType: null,
    foodDetail: '',
    amount: '',
    amountMl: '100',
    burping: false,
  });

  const [kidId, setKidId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // 아이 정보 가져오기
  useEffect(() => {
    const fetchKidInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

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
      }
    };

    fetchKidInfo();
  }, []);

  useEffect(() => {
    if (!editRecord) return;
    const typeLabelMap = {
      breast_milk: '모유',
      formula: '분유',
      bottle: '젖병',
      baby_food: '이유식',
      snack: '간식',
      other: '기타',
    };
    const dateParts = editRecord.record_date?.split('-');
    const displayDate = dateParts?.length === 3
      ? `${dateParts[0].slice(2)}.${dateParts[1]}.${dateParts[2]}`
      : getDefaultDate();
    const mealTime = editRecord.meal_datetime ? new Date(editRecord.meal_datetime) : null;
    const hour = mealTime ? String(mealTime.getHours()).padStart(2, '0') : '00';
    const minute = mealTime ? String(mealTime.getMinutes()).padStart(2, '0') : '00';

    setFormData((prev) => ({
      ...prev,
      date: displayDate,
      hour,
      minute,
      unknownTime: editRecord.unknown_time || false,
      duration: editRecord.duration_minutes != null ? String(editRecord.duration_minutes) : '15',
      foodType: typeLabelMap[editRecord.meal_type] || null,
      foodDetail: editRecord.meal_detail || '',
      amountMl: editRecord.amount_ml != null ? String(editRecord.amount_ml) : '',
      amount: editRecord.amount_text || '',
      burping: editRecord.burp || false,
      memo: editRecord.memo || '',
    }));
  }, [editRecord]);

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

  // 날짜 파싱 (YY.MM.DD -> YYYY-MM-DD)
  const parseDate = (dateStr) => {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    return dateStr;
  };

  // 등록하기
  const handleSubmit = async () => {
    if (!kidId) {
      alert('아이 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!formData.foodType) {
      alert('음식 유형을 선택해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const recordDate = parseDate(formData.date);
      const mealDatetime = formData.unknownTime
        ? `${recordDate}T12:00:00`
        : `${recordDate}T${formData.hour}:${formData.minute}:00`;

      const mealType = foodTypeToEnum[formData.foodType] || 'other';

      const requestBody = {
        record_date: recordDate,
        meal_datetime: mealDatetime,
        unknown_time: formData.unknownTime,
        duration_minutes: parseInt(formData.duration) || null,
        meal_type: mealType,
        meal_detail: needsDetailInput ? formData.foodDetail : null,
        amount_ml: needsMlAmount ? parseInt(formData.amountMl) : null,
        amount_text: needsTextAmount ? formData.amount : null,
        burp: formData.burping,
        memo: null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/meal/${editRecord.id}`
        : `/api/kids/${kidId}/records/meal`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '식사 기록이 수정되었습니다.' : '식사 기록이 등록되었습니다.');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '식사 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('식사 기록 등록 실패:', error);
      alert('식사 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
              checked={formData.burping}
              onChange={(e) => handleInputChange('burping', e.target.checked)}
            />
            <span className="meal-checkbox-custom large">
              {formData.burping && (
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
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록하기'}
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
