import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '../components/home/BottomTabBar';
import etcMock from '../assets/categories/기타.png';
import './EtcRecordAddPage.css';

function EtcRecordAddPage() {
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
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
      category: '기타',
      createdAt: new Date().toISOString(),
    };
    console.log('기타 기록 데이터:', recordData);
    alert('기타 기록이 등록되었습니다');
    navigate('/record');
  };

  // 취소
  const handleCancel = () => {
    navigate('/record');
  };

  return (
    <div className="etc-add-page">
      {/* 서브 헤더 */}
      <div className="etc-add-subheader">
        <button className="etc-add-back" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>기록 추가하기</span>
        </button>
      </div>

      {/* 카테고리 이미지 */}
      <div className="etc-category-label">
        <img src={etcMock} alt="기타" className="etc-category-image" />
      </div>

      {/* 폼 영역 */}
      <div className="etc-form">
        {/* 제목 */}
        <div className="etc-form-section">
          <label className="etc-form-label">제목</label>
          <input
            type="text"
            className="etc-form-input"
            placeholder="내용을 입력하세요"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </div>

        {/* 메모 */}
        <div className="etc-form-section memo-section">
          <label className="etc-form-label">메모</label>
          <textarea
            className="etc-form-textarea"
            placeholder="내용을 입력하세요"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            rows={4}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="etc-form-buttons">
          <button
            type="button"
            className="etc-submit-btn"
            onClick={handleSubmit}
          >
            등록하기
          </button>
          <button
            type="button"
            className="etc-cancel-btn"
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

export default EtcRecordAddPage;
