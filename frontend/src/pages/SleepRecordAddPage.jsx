import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import sleepMock from '../assets/categories/수면.png';
import './SleepRecordAddPage.css';

function SleepRecordAddPage() {
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

  const getTimeParts = (datetime) => {
    if (!datetime) return { hour: '00', minute: '00' };
    const date = new Date(datetime);
    return {
      hour: String(date.getHours()).padStart(2, '0'),
      minute: String(date.getMinutes()).padStart(2, '0'),
    };
  };

  // 폼 상태
  const [formData, setFormData] = useState({
    date: getDisplayDate(),
    sleepType: null,
    startDate: getDisplayDate(),
    startHour: '00',
    startMinute: '00',
    endDate: getDisplayDate(),
    endHour: '00',
    endMinute: '00',
    quality: null,
    memo: '',
  });

  // 드롭다운 상태
  const [showStartHourDropdown, setShowStartHourDropdown] = useState(false);
  const [showStartMinuteDropdown, setShowStartMinuteDropdown] = useState(false);
  const [showEndHourDropdown, setShowEndHourDropdown] = useState(false);
  const [showEndMinuteDropdown, setShowEndMinuteDropdown] = useState(false);

  // 드롭다운 ref
  const startHourRef = useRef(null);
  const startMinuteRef = useRef(null);
  const endHourRef = useRef(null);
  const endMinuteRef = useRef(null);

  // 시간/분 옵션
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startHourRef.current && !startHourRef.current.contains(e.target)) {
        setShowStartHourDropdown(false);
      }
      if (startMinuteRef.current && !startMinuteRef.current.contains(e.target)) {
        setShowStartMinuteDropdown(false);
      }
      if (endHourRef.current && !endHourRef.current.contains(e.target)) {
        setShowEndHourDropdown(false);
      }
      if (endMinuteRef.current && !endMinuteRef.current.contains(e.target)) {
        setShowEndMinuteDropdown(false);
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
    const sleepTypeMap = { night: '밤잠', nap: '낮잠' };
    const qualityMap = { good: '좋음', normal: '보통', bad: '나쁨' };
    const startParts = getTimeParts(editRecord.start_datetime);
    const endParts = getTimeParts(editRecord.end_datetime);

    setFormData({
      date: toDisplayDate(editRecord.record_date),
      sleepType: sleepTypeMap[editRecord.sleep_type] || null,
      startDate: toDisplayDate(editRecord.record_date),
      startHour: startParts.hour,
      startMinute: startParts.minute,
      endDate: toDisplayDate(editRecord.record_date),
      endHour: endParts.hour,
      endMinute: endParts.minute,
      quality: qualityMap[editRecord.sleep_quality] || null,
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

    if (!formData.sleepType) {
      alert('수면 종류를 선택해주세요.');
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
      const startDate = parseDate(formData.startDate);
      const endDate = parseDate(formData.endDate);
      const sleepTypeMap = { '밤잠': 'night', '낮잠': 'nap' };
      const qualityMap = { '좋음': 'good', '보통': 'normal', '나쁨': 'bad' };

      const requestBody = {
        record_date: recordDate,
        sleep_type: sleepTypeMap[formData.sleepType],
        start_datetime: `${startDate}T${formData.startHour}:${formData.startMinute}:00`,
        end_datetime: `${endDate}T${formData.endHour}:${formData.endMinute}:00`,
        sleep_quality: formData.quality ? qualityMap[formData.quality] : null,
        memo: formData.memo || null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/sleep/${editRecord.id}`
        : `/api/kids/${kidId}/records/sleep`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '수면 기록이 수정되었습니다' : '수면 기록이 등록되었습니다');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '수면 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('수면 기록 등록 실패:', error);
      alert('수면 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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

            {/* 시작 시간 드롭다운 */}
            <div className="sleep-time-dropdown-container" ref={startHourRef}>
              <button
                type="button"
                className={`sleep-time-select ${formData.startHour !== '00' ? 'selected' : ''}`}
                onClick={() => setShowStartHourDropdown(!showStartHourDropdown)}
              >
                {formData.startHour}
              </button>
              {showStartHourDropdown && (
                <div className="sleep-dropdown-menu">
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`sleep-dropdown-item ${formData.startHour === hour ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('startHour', hour);
                        setShowStartHourDropdown(false);
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="sleep-time-separator">:</span>

            {/* 시작 분 드롭다운 */}
            <div className="sleep-time-dropdown-container" ref={startMinuteRef}>
              <button
                type="button"
                className={`sleep-time-select ${formData.startMinute !== '00' ? 'selected' : ''}`}
                onClick={() => setShowStartMinuteDropdown(!showStartMinuteDropdown)}
              >
                {formData.startMinute}
              </button>
              {showStartMinuteDropdown && (
                <div className="sleep-dropdown-menu">
                  {minutes.map(minute => (
                    <div
                      key={minute}
                      className={`sleep-dropdown-item ${formData.startMinute === minute ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('startMinute', minute);
                        setShowStartMinuteDropdown(false);
                      }}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            {/* 종료 시간 드롭다운 */}
            <div className="sleep-time-dropdown-container" ref={endHourRef}>
              <button
                type="button"
                className={`sleep-time-select ${formData.endHour !== '00' ? 'selected' : ''}`}
                onClick={() => setShowEndHourDropdown(!showEndHourDropdown)}
              >
                {formData.endHour}
              </button>
              {showEndHourDropdown && (
                <div className="sleep-dropdown-menu">
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`sleep-dropdown-item ${formData.endHour === hour ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('endHour', hour);
                        setShowEndHourDropdown(false);
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="sleep-time-separator">:</span>

            {/* 종료 분 드롭다운 */}
            <div className="sleep-time-dropdown-container" ref={endMinuteRef}>
              <button
                type="button"
                className={`sleep-time-select ${formData.endMinute !== '00' ? 'selected' : ''}`}
                onClick={() => setShowEndMinuteDropdown(!showEndMinuteDropdown)}
              >
                {formData.endMinute}
              </button>
              {showEndMinuteDropdown && (
                <div className="sleep-dropdown-menu">
                  {minutes.map(minute => (
                    <div
                      key={minute}
                      className={`sleep-dropdown-item ${formData.endMinute === minute ? 'selected' : ''}`}
                      onClick={() => {
                        handleInputChange('endMinute', minute);
                        setShowEndMinuteDropdown(false);
                      }}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
