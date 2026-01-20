import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import healthMock from '../assets/categories/건강.png';
import './HealthRecordAddPage.css';

function HealthRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    date: '26.01.26',
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
  const handleSubmit = () => {
    const recordData = {
      ...formData,
      time: `${formData.hour}:${formData.minute}`,
      symptoms,
      medicines,
      category: '건강',
      createdAt: new Date().toISOString(),
    };
    console.log('건강 기록 데이터:', recordData);
    alert('건강 기록이 등록되었습니다');
    navigate('/record');
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
          <div className="health-tags">
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
