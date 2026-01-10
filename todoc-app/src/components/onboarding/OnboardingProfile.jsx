import { useState } from 'react';
import './OnboardingProfile.css';

function OnboardingProfile({ onNext, onBack, onSkip, initialData = {} }) {
  const [profile, setProfile] = useState({
    gender: initialData.gender || null,
    birthTiming: initialData.birthTiming || null,
    feedingType: initialData.feedingType || null,
    recorder: initialData.recorder || null,
  });

  const handleSelect = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  };

  const handleSubmit = () => {
    onNext(profile);
  };

  return (
    <div className="profile-container">
      {/* 상단 헤더 */}
      <div className="profile-top-bar">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="skip-button" onClick={onSkip}>
          건너뛰기
        </button>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="profile-content">
        {/* 헤더 */}
        <div className="profile-header">
          <h1 className="profile-title">
            더 도와드릴 수 있는 정보가 있어요.
          </h1>
          <p className="profile-subtitle">모든 정보를 입력할 필요는 없답니다!</p>
        </div>

        {/* 섹션 1: 성별 */}
        <div className="profile-section emphasize-options">
          <label className="section-label">성별</label>
          <div className="button-group two-columns">
            <button
              className={`select-button ${profile.gender === 'male' ? 'selected-male' : ''}`}
              onClick={() => handleSelect('gender', 'male')}
            >
              남아
            </button>
            <button
              className={`select-button ${profile.gender === 'female' ? 'selected-female' : ''}`}
              onClick={() => handleSelect('gender', 'female')}
            >
              여아
            </button>
          </div>
        </div>

        {/* 섹션 2: 출생 시기 */}
        <div className="profile-section emphasize-options">
          <label className="section-label">출생 시기 (선택)</label>
          <div className="button-group single-column">
            <button
              className={`select-button wide ${profile.birthTiming === 'early' ? 'selected' : ''}`}
              onClick={() => handleSelect('birthTiming', 'early')}
            >
              예정일보다 빨리 태어났어요
            </button>
            <button
              className={`select-button wide ${profile.birthTiming === 'ontime' ? 'selected' : ''}`}
              onClick={() => handleSelect('birthTiming', 'ontime')}
            >
              예정일에 맞춰 태어났어요
            </button>
            <button
              className={`select-button wide ${profile.birthTiming === 'late' ? 'selected' : ''}`}
              onClick={() => handleSelect('birthTiming', 'late')}
            >
              예정일보다 늦게 태어났어요
            </button>
          </div>
          <p className="section-hint">정확하지 않아도 괜찮아요.</p>
        </div>

        {/* 섹션 3: 수유 방식 */}
        <div className="profile-section">
          <label className="section-label">주로 어떤 방식으로 수유하나요? (선택)</label>
          <div className="button-group three-columns">
            <button
              className={`select-button ${profile.feedingType === 'breast' ? 'selected' : ''}`}
              onClick={() => handleSelect('feedingType', 'breast')}
            >
              모유
            </button>
            <button
              className={`select-button ${profile.feedingType === 'formula' ? 'selected' : ''}`}
              onClick={() => handleSelect('feedingType', 'formula')}
            >
              분유
            </button>
            <button
              className={`select-button ${profile.feedingType === 'mixed' ? 'selected' : ''}`}
              onClick={() => handleSelect('feedingType', 'mixed')}
            >
              혼합
            </button>
          </div>
        </div>

        {/* 섹션 4: 기록 주체 */}
        <div className="profile-section">
          <label className="section-label">주로 기록을 남기는 분은 누구인가요? (선택)</label>
          <div className="button-group four-columns">
            <button
              className={`select-button ${profile.recorder === 'mom' ? 'selected' : ''}`}
              onClick={() => handleSelect('recorder', 'mom')}
            >
              엄마
            </button>
            <button
              className={`select-button ${profile.recorder === 'dad' ? 'selected' : ''}`}
              onClick={() => handleSelect('recorder', 'dad')}
            >
              아빠
            </button>
            <button
              className={`select-button ${profile.recorder === 'both' ? 'selected' : ''}`}
              onClick={() => handleSelect('recorder', 'both')}
            >
              함께
            </button>
            <button
              className={`select-button ${profile.recorder === 'other' ? 'selected' : ''}`}
              onClick={() => handleSelect('recorder', 'other')}
            >
              기타
            </button>
          </div>
          <p className="section-hint">AI 안내와 말투를 조정하는 데 사용돼요.</p>
        </div>

        {/* 하단 안내 문구 */}
        <div className="profile-footer-info">
          <p>
            *이 정보는 나중에 AI 분석과 맞춤 안내에 사용돼요.<br />
            언제든지 수정할 수 있어요.
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="profile-footer">
        <button className="next-button active" onClick={handleSubmit}>
          다음
        </button>
      </div>
    </div>
  );
}

export default OnboardingProfile;
