import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/base';
import BottomTabBar from '../components/home/BottomTabBar';
import etcMock from '../assets/categories/기타.png';
import './EtcRecordAddPage.css';

function EtcRecordAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editRecord = location.state?.record || null;
  const isEdit = Boolean(editRecord);
  const dateParam = searchParams.get('date');
  const [kidId, setKidId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
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
    setFormData({
      title: editRecord.title || '',
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

      const recordDate = editRecord?.record_date
        ? parseDate(editRecord.record_date)
        : (parseDate(dateParam) || new Date().toISOString().split('T')[0]);

      const requestBody = {
        record_date: recordDate,
        title: formData.title,
        memo: formData.memo || null,
      };

      const endpoint = isEdit
        ? `/api/kids/${kidId}/records/etc/${editRecord.id}`
        : `/api/kids/${kidId}/records/etc`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(isEdit ? '기타 기록이 수정되었습니다' : '기타 기록이 등록되었습니다');
        navigate('/record', { state: { refresh: Date.now() } });
      } else {
        const error = await response.json();
        alert(error.detail || '기타 기록 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('기타 기록 등록 실패:', error);
      alert('기타 기록 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
