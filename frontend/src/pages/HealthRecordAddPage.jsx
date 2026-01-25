import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import healthMock from '../assets/categories/건강.png';
import './HealthRecordAddPage.css';

function HealthRecordAddPage() {
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
    hour: '00',
    minute: '00',
    unknownTime: false,
    title: '',
    memo: '',
  });

  // 드롭다운 상태
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  // 드롭다운 ref
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const symptomRef = useRef(null);
  const medicineRef = useRef(null);

  // 증상 태그 상태
  const [symptoms, setSymptoms] = useState([]);
  const availableSymptoms = ['열', '콧물', '기침', '구토', '설사', '발진', '두통'];

  // 투약 태그 상태
  const [medicines, setMedicines] = useState([]);
  const availableMedicines = ['해열제', '진통제', '감기약', '항생제', '연고', '안약'];

  // 시간/분 옵션 생성
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hourRef.current && !hourRef.current.contains(e.target)) {
        setShowHourDropdown(false);
      }
      if (minuteRef.current && !minuteRef.current.contains(e.target)) {
        setShowMinuteDropdown(false);
      }
      if (symptomRef.current && !symptomRef.current.contains(e.target)) {
        setShowSymptomDropdown(false);
      }
      if (medicineRef.current && !medicineRef.current.contains(e.target)) {
        setShowMedicineDropdown(false);
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
    const symptomLabelMap = {
      fever: '열',
      runny_nose: '콧물',
      cough: '기침',
      vomit: '구토',
      diarrhea: '설사',
      rash: '발진',
      headache: '두통',
    };
    const medicineLabelMap = {
      antipyretic: '해열제',
      painkiller: '진통제',
      cold_medicine: '감기약',
      antibiotic: '항생제',
      ointment: '연고',
      eye_drops: '안약',
    };
    const timeParts = getTimeParts(editRecord.health_datetime);

    setFormData({
      date: toDisplayDate(editRecord.record_date),
      hour: timeParts.hour,
      minute: timeParts.minute,
      unknownTime: editRecord.unknown_time || false,
      title: editRecord.title || '',
      memo: editRecord.memo || '',
    });
    setSymptoms((editRecord.symptoms || []).map((s) => symptomLabelMap[s] || s));
    setMedicines((editRecord.medicines || []).map((m) => medicineLabelMap[m] || m));
  }, [editRecord]);

  // 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 시간 선택
  const handleHourSelect = (hour) => {
    setFormData(prev => ({ ...prev, hour }));
    setShowHourDropdown(false);
  };

  // 분 선택
  const handleMinuteSelect = (minute) => {
    setFormData(prev => ({ ...prev, minute }));
    setShowMinuteDropdown(false);
  };

  // 증상 추가
  const handleAddSymptom = (symptom) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
    }
    setShowSymptomDropdown(false);
  };

  // 증상 삭제
  const handleRemoveSymptom = (symptom) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  // 투약 추가
  const handleAddMedicine = (medicine) => {
    if (!medicines.includes(medicine)) {
      setMedicines([...medicines, medicine]);
    }
    setShowMedicineDropdown(false);
  };

  // 투약 삭제
  const handleRemoveMedicine = (medicine) => {
    setMedicines(medicines.filter(m => m !== medicine));
  };

  // 등록하기
  const handleSubmit = async () => {
    if (!kidId) {
      alert('아이 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
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
      const healthDatetime = formData.unknownTime
        ? `${recordDate}T12:00:00`
        : `${recordDate}T${formData.hour}:${formData.minute}:00`;

      const symptomMap = {
        열: 'fever',
        콧물: 'runny_nose',
        기침: 'cough',
        구토: 'vomit',
        설사: 'diarrhea',
        발진: 'rash',
        두통: 'headache',
      };

      const medicineMap = {
        해열제: 'antipyretic',
        진통제: 'painkiller',
        감기약: 'cold_medicine',
        항생제: 'antibiotic',
        연고: 'ointment',
        안약: 'eye_drops',
      };

      const requestBody = {
        record_date: recordDate,
        health_datetime: healthDatetime,
        unknown_time: formData.unknownTime,
        title: formData.title,
        symptoms: symptoms.map((symptom) => symptomMap[symptom]).filter(Boolean),
        medicines: medicines.map((medicine) => medicineMap[medicine]).filter(Boolean),
        memo: formData.memo || null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/health/${editRecord.id}`
        : `/api/kids/${kidId}/records/health`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '건강 기록이 수정되었습니다' : '건강 기록이 등록되었습니다');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '건강 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('건강 기록 등록 실패:', error);
      alert('건강 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  // 남은 증상 목록
  const remainingSymptoms = availableSymptoms.filter(s => !symptoms.includes(s));
  // 남은 투약 목록
  const remainingMedicines = availableMedicines.filter(m => !medicines.includes(m));

  return (
    <div className="health-add-page">
      {/* 서브 헤더 */}
      <div className="health-add-subheader">
        <button className="health-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      {/* 카테고리 이미지 */}
      <div className="health-category-label">
        <img src={healthMock} alt="건강" className="health-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="health-form">
        {/* 날짜 및 시간 */}
        <div className="health-form-section">
          <label className="health-form-label">날짜 및 시간</label>
          <div className="health-datetime-row">
            <input
              type="text"
              className="health-form-input health-input-date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />

            {/* 시간 드롭다운 */}
            <div className="health-time-dropdown-container" ref={hourRef}>
              <button
                type="button"
                className={`health-time-select ${formData.unknownTime ? 'disabled' : ''}`}
                onClick={() => !formData.unknownTime && setShowHourDropdown(!showHourDropdown)}
                disabled={formData.unknownTime}
              >
                {formData.hour}
              </button>
              {showHourDropdown && (
                <div className="health-dropdown-menu time-dropdown">
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`health-dropdown-item ${formData.hour === hour ? 'selected' : ''}`}
                      onClick={() => handleHourSelect(hour)}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="health-time-separator">:</span>

            {/* 분 드롭다운 */}
            <div className="health-time-dropdown-container" ref={minuteRef}>
              <button
                type="button"
                className={`health-time-select ${formData.unknownTime ? 'disabled' : ''}`}
                onClick={() => !formData.unknownTime && setShowMinuteDropdown(!showMinuteDropdown)}
                disabled={formData.unknownTime}
              >
                {formData.minute}
              </button>
              {showMinuteDropdown && (
                <div className="health-dropdown-menu time-dropdown">
                  {minutes.map(minute => (
                    <div
                      key={minute}
                      className={`health-dropdown-item ${formData.minute === minute ? 'selected' : ''}`}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="health-checkbox-label">
              <input
                type="checkbox"
                checked={formData.unknownTime}
                onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
              />
              <span className="health-checkbox-custom">
                {formData.unknownTime && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="#328B6D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span>모름</span>
            </label>
          </div>
        </div>

        {/* 제목 */}
        <div className="health-form-section">
          <label className="health-form-label">제목</label>
          <input
            type="text"
            className="health-form-input health-input-title"
            placeholder="제목을 입력하세요"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </div>

        {/* 증상 */}
        <div className="health-form-section">
          <label className="health-form-label">증상</label>
          <div className="health-tags">
            {symptoms.map((symptom, index) => (
              <span
                key={index}
                className="health-tag active"
                onClick={() => handleRemoveSymptom(symptom)}
              >
                {symptom}
              </span>
            ))}
            <div className="health-tag-dropdown-container" ref={symptomRef}>
              <button
                type="button"
                className="health-add-tag-btn"
                onClick={() => setShowSymptomDropdown(!showSymptomDropdown)}
              >
                + 증상 추가
              </button>
              {showSymptomDropdown && remainingSymptoms.length > 0 && (
                <div className="health-dropdown-menu tag-dropdown">
                  {remainingSymptoms.map(symptom => (
                    <div
                      key={symptom}
                      className="health-dropdown-item"
                      onClick={() => handleAddSymptom(symptom)}
                    >
                      {symptom}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 투약 현황 */}
        <div className="health-form-section">
          <label className="health-form-label">투약 현황</label>
          <div className="health-tags medicine">
            {medicines.map((medicine, index) => (
              <span
                key={index}
                className="health-tag active"
                onClick={() => handleRemoveMedicine(medicine)}
              >
                {medicine}
              </span>
            ))}
            <div className="health-tag-dropdown-container" ref={medicineRef}>
              <button
                type="button"
                className="health-add-tag-btn"
                onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
              >
                + 약품 추가
              </button>
              {showMedicineDropdown && remainingMedicines.length > 0 && (
                <div className="health-dropdown-menu tag-dropdown">
                  {remainingMedicines.map(medicine => (
                    <div
                      key={medicine}
                      className="health-dropdown-item"
                      onClick={() => handleAddMedicine(medicine)}
                    >
                      {medicine}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div className="health-form-section memo-section">
          <label className="health-form-label">메모</label>
          <textarea
            className="health-form-textarea"
            placeholder="내용을 입력하세요"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            rows={4}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="health-form-buttons">
          <button
            type="button"
            className="health-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="health-cancel-btn"
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

export default HealthRecordAddPage;
