import { useNavigate } from 'react-router-dom';
import './SupportPage.css';

function SupportPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page">
      <div className="support-content">
        <p className="support-email">hyeon.lee0213@gmail.com</p>
        <p className="support-message">언제든 편하게 메일 주세요. 따뜻하게 답장 드릴게요.</p>
        <button
          type="button"
          className="support-back-btn"
          onClick={() => navigate('/home')}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default SupportPage;
