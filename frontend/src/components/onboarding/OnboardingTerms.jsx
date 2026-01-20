import { useState } from 'react';
import './OnboardingTerms.css';

function OnboardingTerms({ onNext, onBack }) {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleCheck = (key) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 필수 항목 2개가 체크되어야 버튼 활성화
  const isValid = agreements.terms && agreements.privacy;

  const handleSubmit = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="terms-container">
      {/* 뒤로가기 버튼 */}
      <button className="back-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 메인 문구 */}
      <div className="terms-header">
        <h1 className="terms-title">
          시작하기 전,<br />
          아래 내용을 확인해주세요
        </h1>
        <p className="terms-subtitle">*표시는 필수 항목입니다.</p>
      </div>

      {/* 약관 내용 박스 */}
      <div className="terms-content-box">
        <p className="terms-text">
          ToDoc은 아이의 일상을 기록하고
          부모의 육아를 돕기 위한 서비스입니다.
          본 서비스는 의료 진단을 목적으로 하지 않으며,
          제공되는 정보는 참고용입니다.
          <br /><br />
          입력한 정보는 기록 관리와
          맞춤 정보 제공을 위해 사용됩니다.
          모든 정보는 언제든지 수정하거나
          삭제할 수 있습니다.
        </p>
      </div>

      {/* 체크 항목 */}
      <div className="terms-checkboxes">
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={agreements.terms}
            onChange={() => handleCheck('terms')}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-label">
            <span className="required">[필수]</span> 서비스 이용약관 동의
          </span>
        </label>

        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={agreements.privacy}
            onChange={() => handleCheck('privacy')}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-label">
            <span className="required">[필수]</span> 개인정보 수집 및 이용 동의
          </span>
        </label>

        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={agreements.marketing}
            onChange={() => handleCheck('marketing')}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-label">
            <span className="optional">[선택]</span> 맞춤 정보 제공 동의
          </span>
        </label>
      </div>

      {/* 시작하기 버튼 */}
      <div className="terms-footer">
        <button
          className={`submit-button ${isValid ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
          disabled={!isValid}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

export default OnboardingTerms;
