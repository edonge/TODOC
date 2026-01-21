import { useNavigate } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ModeCard from '../components/ai/ModeCard';
import ChatHistoryItem from '../components/ai/ChatHistoryItem';
import BottomTabBar from '../components/home/BottomTabBar';
import momImg from '../assets/WJ/MomAI.png';
import doctorImg from '../assets/WJ/DoctorAI.png';
import nutritionImg from '../assets/WJ/NutrientAI.png';
import { AI_MODES, chatHistory } from '../data/aiChats';
import './AiHomePage.css';

function AiHomePage() {
  const navigate = useNavigate();

  const modeCards = [
    { ...AI_MODES.mom, image: momImg },
    { ...AI_MODES.doctor, image: doctorImg },
    { ...AI_MODES.nutrition, image: nutritionImg },
  ];

  return (
    <div className="ai-home-page">
      <ChatHeader />

      <section className="ai-section">
        <h2 className="ai-section-title">새로운 채팅 시작하기</h2>
        <div className="ai-mode-grid">
          {modeCards.map((mode) => (
            <ModeCard
              key={mode.id}
              image={mode.image}
              label={mode.label}
              background={mode.cardBg}
              outline={mode.accent}
              onClick={() => navigate(`/ai/${mode.id}`)}
            />
          ))}
        </div>
      </section>

      <section className="ai-section">
        <h2 className="ai-section-title">지난 채팅 내역</h2>
        <div className="ai-history-list">
          {chatHistory.map((item) => (
            <ChatHistoryItem key={item.id} item={item} />
          ))}
        </div>
      </section>

      <BottomTabBar activeTab="토닥 AI" />
    </div>
  );
}

export default AiHomePage;
