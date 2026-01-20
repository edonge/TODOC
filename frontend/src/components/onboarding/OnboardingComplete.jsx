import parentImage from '../../assets/onboarding_parent.png';
import './OnboardingComplete.css';

function OnboardingComplete({ onComplete, onBack }) {
  return (
    <div className="complete-container">
      {/* 뒤로가기 버튼 */}
      <button className="back-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 일러스트 이미지 */}
      <div className="complete-illustration">
        <img
          src={parentImage}
          alt="부모"
          className="complete-image"
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="complete-text">
        <h1 className="complete-title">알려주셔서 고마워요.</h1>
        <p className="complete-description">
          이제부터 이 정보들을 바탕으로<br />
          기록을 자동으로 정리하고<br />
          맞춤 정보를 만들어 드릴게요.
        </p>
        <p className="complete-hint">
          이 정보는 언제든지 수정할 수 있어요.
        </p>
        <div className="complete-actions">
          <button className="start-button" onClick={onComplete}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingComplete;
