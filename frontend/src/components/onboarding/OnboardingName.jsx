import { useState } from 'react';
import './OnboardingName.css';

function OnboardingName({ onNext, onBack, initialName = '' }) {
  const [name, setName] = useState(initialName);

  const handleSubmit = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <div className="name-container">
      {/* 뒤로가기 버튼 */}
      <button className="back-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 헤더 영역 */}
      <div className="name-header">
        <h1 className="name-title">
          반가워요!<br />
          아이를 어떻게 불러드리면 될까요?
        </h1>
        <p className="name-subtitle">아이 태명이나 애칭도 좋아요</p>
      </div>

      <div className="name-input-area">
        {/* 입력 필드 */}
        <div className="name-input-wrapper">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 또는 애칭"
            className="name-input"
            autoFocus
          />
        </div>

        {/* 다음 버튼 */}
        <div className="name-footer">
          <button
            className={`next-button ${name.trim() ? 'active' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingName;
