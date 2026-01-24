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
        <p className="insight-text coming-soon">구현 예정입니다</p>
      </div>
    </section>
  );
}

export default InsightCard;
