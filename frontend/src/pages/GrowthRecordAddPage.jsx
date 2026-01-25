import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import growthMock from '../assets/categories/성장.png';
import './GrowthRecordAddPage.css';

function GrowthRecordAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editRecord = location.state?.record || null;
  const isEdit = Boolean(editRecord);
  const dateParam = searchParams.get('date');
  const [kidId, setKidId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getDisplayDate = () => {
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

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
      return dateStr;
    }
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    return dateStr;
  };

  const toDisplayDate = (dateStr) => {
    if (!dateStr) return getDisplayDate();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
    }
    return dateStr;
  };

  // 폼 상태
  const [formData, setFormData] = useState({
    date: getDisplayDate(),
    height: '',
    weight: '',
    headCircumference: '',
    memo: '',
  });

  // 활동 태그 상태
  const [activities, setActivities] = useState([]);
  const availableActivities = ['독서', '산책', '목욕', '놀이', '음악', '체조', '수영'];

  // 드롭다운 상태
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const activityRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activityRef.current && !activityRef.current.contains(e.target)) {
        setShowActivityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const activityLabelMap = {
      reading: '독서',
      walking: '산책',
      bathing: '목욕',
      playing: '놀이',
      music: '음악',
      exercise: '체조',
      swimming: '수영',
    };

    setFormData({
      date: toDisplayDate(editRecord.record_date),
      height: editRecord.height_cm?.toString() || '',
      weight: editRecord.weight_kg?.toString() || '',
      headCircumference: editRecord.head_circumference_cm?.toString() || '',
      memo: editRecord.memo || '',
    });
    setActivities((editRecord.activities || []).map((a) => activityLabelMap[a] || a));
  }, [editRecord]);

  // 입력값 제한 및 유효성 검사
  const validateAndFormatInput = (value, type) => {
    // 빈 값 허용
    if (value === '') return '';

    // 숫자와 소수점만 허용
    let cleaned = value.replace(/[^0-9.]/g, '');

    // 소수점이 여러 개인 경우 첫 번째만 유지
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // 자릿수 제한
    if (type === 'weight') {
      // 몸무게: 최대 2자리 + 소수 1자리 (예: 30.0)
      if (parts[0] && parts[0].length > 2) {
        parts[0] = parts[0].slice(0, 2);
      }
    } else {
      // 키/머리둘레: 최대 3자리 + 소수 1자리 (예: 120.0)
      if (parts[0] && parts[0].length > 3) {
        parts[0] = parts[0].slice(0, 3);
      }
    }

    // 소수점 이하 1자리로 제한
    if (parts[1] && parts[1].length > 1) {
      parts[1] = parts[1].slice(0, 1);
    }

    cleaned = parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];

    return cleaned;
  };

  // 범위 검사 (저장 시)
  const isValidRange = (value, min, max) => {
    if (value === '' || value === null) return true; // 빈 값은 허용
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return false;
    return num >= min && num <= max;
  };

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    if (field === 'height') {
      const formatted = validateAndFormatInput(value, 'height');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'weight') {
      const formatted = validateAndFormatInput(value, 'weight');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'headCircumference') {
      const formatted = validateAndFormatInput(value, 'head');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 활동 추가
  const handleAddActivity = (activity) => {
    if (!activities.includes(activity)) {
      setActivities([...activities, activity]);
    }
    setShowActivityDropdown(false);
  };

  // 활동 삭제
  const handleRemoveActivity = (activity) => {
    setActivities(activities.filter(a => a !== activity));
  };

  // 남은 활동 목록
  const remainingActivities = availableActivities.filter(a => !activities.includes(a));

  // 등록하기
  const handleSubmit = async () => {
    if (!kidId) {
      alert('아이 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 유효성 검사
    const errors = [];

    if (formData.height && !isValidRange(formData.height, 30, 140)) {
      errors.push('키는 30~140cm 사이로 입력해주세요.');
    }
    if (formData.weight && !isValidRange(formData.weight, 1, 45)) {
      errors.push('몸무게는 1~45kg 사이로 입력해주세요.');
    }
    if (formData.headCircumference && !isValidRange(formData.headCircumference, 20, 62)) {
      errors.push('머리 둘레는 20~62cm 사이로 입력해주세요.');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
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
      const activityMap = {
        독서: 'reading',
        산책: 'walking',
        목욕: 'bathing',
        놀이: 'playing',
        음악: 'music',
        체조: 'exercise',
        수영: 'swimming',
      };

      const requestBody = {
        record_date: recordDate,
        height_cm: formData.height ? parseFloat(formData.height) : null,
        weight_kg: formData.weight ? parseFloat(formData.weight) : null,
        head_circumference_cm: formData.headCircumference ? parseFloat(formData.headCircumference) : null,
        activities: activities.map((activity) => activityMap[activity]).filter(Boolean),
        memo: formData.memo || null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/growth/${editRecord.id}`
        : `/api/kids/${kidId}/records/growth`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '성장 기록이 수정되었습니다' : '성장 기록이 등록되었습니다');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '성장 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('성장 기록 등록 실패:', error);
      alert('성장 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
            <label className="growth-form-label">키 <span className="growth-range-hint">(30~140)</span></label>
            <div className="growth-input-with-unit height">
              <input
                type="text"
                className="growth-form-input growth-input-height"
                placeholder="00.0"
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
            <label className="growth-form-label">몸무게 <span className="growth-range-hint">(1~45)</span></label>
            <div className="growth-input-with-unit weight">
              <input
                type="text"
                className="growth-form-input growth-input-weight"
                placeholder="00.0"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
              <span className="growth-unit">kg</span>
            </div>
          </div>
          <div className="growth-form-group">
            <label className="growth-form-label">머리 둘레 <span className="growth-range-hint">(20~62)</span></label>
            <div className="growth-input-with-unit head">
              <input
                type="text"
                className="growth-form-input growth-input-head"
                placeholder="00.0"
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
          <div className="growth-add-activities">
            {activities.map((activity, index) => (
              <span
                key={index}
                className="growth-activity-tag active"
                onClick={() => handleRemoveActivity(activity)}
              >
                {activity}
              </span>
            ))}
            <div className="growth-activity-dropdown-container" ref={activityRef}>
              <button
                type="button"
                className="growth-add-activity-btn"
                onClick={() => setShowActivityDropdown(!showActivityDropdown)}
              >
                + 활동 추가
              </button>
              {showActivityDropdown && remainingActivities.length > 0 && (
                <div className="growth-dropdown-menu">
                  {remainingActivities.map(activity => (
                    <div
                      key={activity}
                      className="growth-dropdown-item"
                      onClick={() => handleAddActivity(activity)}
                    >
                      {activity}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
