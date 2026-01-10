import todocAIIcon from '../../assets/icons/TodocAI.png';
import './InsightCard.css';

function InsightCard() {
  return (
    <section className="insight-card">
      <div className="insight-header">
        <img src={todocAIIcon} alt="토닥 AI" className="insight-icon" />
        <span className="insight-title">
          <span className="highlight">토닥</span>이 최근 기록을 살펴봤어요
        </span>
      </div>

      <div className="insight-content">
        <p className="insight-text">최근 낮잠 기록이 조금 적어요.</p>
        <p className="insight-text emphasis">
          오늘은 짧게라도 쉬는 시간을 만들어봐요.
        </p>
        <p className="insight-sub">
          최근 3일간 낮잠 기록이 평소보다 적었어요.
        </p>
      </div>
    </section>
  );
}

export default InsightCard;
