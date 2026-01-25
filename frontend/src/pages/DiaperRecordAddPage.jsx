import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import diaperMock from '../assets/categories/배변.png';
import './DiaperRecordAddPage.css';

function DiaperRecordAddPage() {
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
    time: '00:00',
    unknownTime: false,
    type: null, // '소변', '대변', '둘다'
    amount: null, // '많음', '보통', '적음'
    condition: null, // '정상', '설사', '변비'
    color: null, // '노랑', '갈색', '초록', '이외'
    memo: '',
  });

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
    const typeLabelMap = { urine: '소변', stool: '대변', both: '둘다' };
    const amountLabelMap = { much: '많음', normal: '보통', little: '적음' };
    const conditionLabelMap = { normal: '정상', diarrhea: '설사', constipation: '변비' };
    const colorLabelMap = { yellow: '노랑', brown: '갈색', green: '초록', other: '이외' };
    const time = editRecord.diaper_datetime ? new Date(editRecord.diaper_datetime) : null;
    const timeLabel = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
      : '00:00';

    setFormData({
      date: toDisplayDate(editRecord.record_date),
      time: timeLabel,
      unknownTime: editRecord.unknown_time || false,
      type: typeLabelMap[editRecord.diaper_type] || null,
      amount: amountLabelMap[editRecord.amount] || null,
      condition: conditionLabelMap[editRecord.condition] || null,
      color: colorLabelMap[editRecord.color] || null,
      memo: editRecord.memo || '',
    });
  }, [editRecord]);

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 등록하기
  const handleSubmit = async () => {
    if (!kidId) {
      alert('아이 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!formData.type) {
      alert('종류를 선택해주세요.');
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
      const diaperDatetime = formData.unknownTime
        ? `${recordDate}T12:00:00`
        : `${recordDate}T${formData.time}:00`;

      const typeMap = { 소변: 'urine', 대변: 'stool', 둘다: 'both' };
      const amountMap = { 많음: 'much', 보통: 'normal', 적음: 'little' };
      const conditionMap = { 정상: 'normal', 설사: 'diarrhea', 변비: 'constipation' };
      const colorMap = { 노랑: 'yellow', 갈색: 'brown', 초록: 'green', 이외: 'other' };

      const requestBody = {
        record_date: recordDate,
        diaper_datetime: diaperDatetime,
        unknown_time: formData.unknownTime,
        diaper_type: typeMap[formData.type],
        amount: formData.amount ? amountMap[formData.amount] : null,
        condition: formData.condition ? conditionMap[formData.condition] : null,
        color: formData.color ? colorMap[formData.color] : null,
        memo: formData.memo || null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/diaper/${editRecord.id}`
        : `/api/kids/${kidId}/records/diaper`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '배변 기록이 수정되었습니다' : '배변 기록이 등록되었습니다');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '배변 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('배변 기록 등록 실패:', error);
      alert('배변 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
