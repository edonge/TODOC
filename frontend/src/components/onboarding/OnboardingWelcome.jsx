import parentChildImage from '../../assets/onboarding_parent_child.png';
import './OnboardingWelcome.css';

function OnboardingWelcome({ onNext }) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        {/* 일러스트 이미지 */}
        <div className="welcome-illustration">
          <img
            src={parentChildImage}
            alt="부모와 아이"
            className="welcome-image"
          />
        </div>

        {/* 메인 문구 */}
        <div className="welcome-text">
          <p className="welcome-message">
            오늘부터는,<br />
            토닥이 도와드릴게요.
          </p>
        </div>

        {/* 시작하기 버튼 */}
        <button className="start-button" onClick={onNext}>
          시작하기
        </button>
      </div>
    </div>
  );
}

export default OnboardingWelcome;
