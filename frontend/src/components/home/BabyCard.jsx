import { useNavigate } from 'react-router-dom';
import './BabyCard.css';

function BabyCard({ childData, recentRecord }) {
  const navigate = useNavigate();

  // 생년월일로부터 생후 개월수 계산
  const calculateAge = (birthday) => {
    if (!birthday) return '정보 없음';

    const birthDate = new Date(birthday);
    const today = new Date();

    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months += today.getMonth() - birthDate.getMonth();

    // 일자가 아직 안 지났으면 1개월 빼기
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }

    if (months < 0) return '정보 없음';
    if (months === 0) return '신생아';
    return `생후 ${months}개월`;
  };

  // 상대 시간 계산
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  // 기록 타입별 정보 (타입명, 아이콘, 값)
  const getRecordInfo = (record) => {
    if (!record) return null;

    const recordType = record.record_type;

    // 수유/식사
    if (recordType === 'meal') {
      const mealTypeLabels = {
        breast_milk: '모유',
        formula: '분유',
        bottle: '젖병',
        baby_food: '이유식',
        snack: '간식',
        other: '기타',
      };
      const label = mealTypeLabels[record.meal_type] || '수유';
      let value = '';
      if (record.amount_ml) value = `${record.amount_ml}ml`;
      else if (record.amount_text) value = record.amount_text;

      return {
        type: label,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 2V8C6 10.2091 7.79086 12 10 12H14C16.2091 12 18 10.2091 18 8V2" stroke="#FFB347" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 12V22" stroke="#FFB347" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 22H16" stroke="#FFB347" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        value,
      };
    }

    // 수면
    if (recordType === 'sleep') {
      const sleepTypeLabels = {
        night: '밤잠',
        nap: '낮잠',
      };
      const label = sleepTypeLabels[record.sleep_type] || '수면';
      const value = record.duration_hours ? `${record.duration_hours}시간` : '';

      return {
        type: label,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="#7B9ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        value,
      };
    }

    // 배변
    if (recordType === 'diaper') {
      const diaperTypeLabels = {
        urine: '소변',
        stool: '대변',
        both: '소변+대변',
      };
      const label = diaperTypeLabels[record.diaper_type] || '배변';

      return {
        type: label,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="14" rx="8" ry="6" stroke="#A8D5BA" strokeWidth="2"/>
            <path d="M8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8" stroke="#A8D5BA" strokeWidth="2"/>
          </svg>
        ),
        value: '',
      };
    }

    // 성장
    if (recordType === 'growth') {
      let value = '';
      if (record.height_cm) value = `${record.height_cm}cm`;
      if (record.weight_kg) value += value ? ` / ${record.weight_kg}kg` : `${record.weight_kg}kg`;

      return {
        type: '성장',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2V22" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 6L12 2L16 6" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 12H18" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        value,
      };
    }

    // 건강
    if (recordType === 'health') {
      return {
        type: '건강',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke="#FF6B6B" strokeWidth="2"/>
          </svg>
        ),
        value: record.title || '',
      };
    }

    // 기타
    return {
      type: '기타',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#AAAAAA" strokeWidth="2"/>
          <path d="M12 8V12L15 15" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      value: record.title || '',
    };
  };

  const recordInfo = getRecordInfo(recentRecord);

  const age = calculateAge(childData.birthday);
  const displayName = childData.name || '아이 이름';

  const handleMoreClick = () => {
    navigate('/record');
  };

  return (
    <div className="baby-card-stack">
      <section className="baby-card">
        {/* 상단 헤더 */}
        <div className="baby-card-header">
          <div className="baby-info">
            <span className="baby-name">{displayName}</span>
            <span className="baby-age">{age}</span>
          </div>
          <button className="more-button" onClick={handleMoreClick}>더보기</button>
        </div>

        {/* 카드 컨텐츠 */}
        <div className="baby-card-content">
          {/* 아이 아이콘 영역 */}
          <div className="baby-photo-wrapper">
            <div className="baby-icon-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="#CCCCCC" strokeWidth="1.5"/>
                <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* 최근 기록 영역 */}
          <div className="recent-record">
            <span className="record-label">최근 기록</span>
            {recentRecord ? (
              <div className="record-box">
                <span className="record-type">{recordInfo?.type || '-'}</span>
                <span className="record-value">{recordInfo?.value || ''}</span>
                <span className="record-time">{getRelativeTime(recentRecord.created_at)}</span>
              </div>
            ) : (
              <div className="record-box">
                <span className="record-notice">기록이 없습니다</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BabyCard;
