import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import BottomTabBar from '../components/home/BottomTabBar';
import { AI_MODES, introMessages } from '../data/aiChats';
import './AiChatPage.css';

const SAMPLE_CONVERSATIONS = {
  mom: [
    { sender: 'ai', text: '육아하면서 혼자 고민하고 계신 게 있나요? 사소한 이야기라도 괜찮아요.' },
    { sender: 'ai', text: '육아 지식, 경험, 감정적 고민, 일상적인 판단까지 궁금한 점을 알려주세요.' },
    { sender: 'user', text: '젖병을 소독하려고 하는데, 젖병과 젖꼭지를 따로 할까? 소독하는 게 나을까?' },
    { sender: 'ai', text: '젖병과 젖꼭지는 분리해서 열탕 소독하는 게 좋아요. 열탕은 5분 정도, 실리콘 젖꼭지는 너무 끓이면 변형될 수 있으니 5분 이상은 피하는 게 좋습니다.' },
  ],
  doctor: [
    { sender: 'ai', text: '아이가 평소와 달라 보여 걱정되시나요? 증상, 변화, 궁금한 점을 알려주세요.' },
    { sender: 'user', text: '밤마다 씩씩거리고 콧소리가 나요. 건조해서 그런 걸까요?' },
    { sender: 'ai', text: '밤에 씩씩거리면 건조한 공기나 코막힘일 수 있어요. 실내 습도를 40~60% 유지하고, 잠들기 전 미지근한 물로 세수해 주세요. 열이 나거나 숨쉬기 힘들면 바로 진료를 권장합니다.' },
  ],
  nutrition: [
    { sender: 'ai', text: '아이 식사와 영양 때문에 고민되는 점이 있나요? 균형 잡힌 식단과 간식, 이유식 준비를 함께 도와드릴게요.' },
    { sender: 'user', text: '멸치, 애호박, 두부로 이유식을 만들려는데 소고기, 닭고기 중 어떤 게 좋아?' },
    { sender: 'ai', text: '멸치·애호박·두부 조합에는 닭고기가 부드럽고 담백해 잘 어울립니다. 소고기는 다음 단계에서 조금씩 추가해 보세요.' },
  ],
};

function AiChatPage() {
  const { mode } = useParams();
  const navigate = useNavigate();

  const meta = useMemo(() => AI_MODES[mode] ?? AI_MODES.mom, [mode]);
  const intro = introMessages[meta.id] ?? introMessages.mom;
  const conversation = SAMPLE_CONVERSATIONS[meta.id] ?? SAMPLE_CONVERSATIONS.mom;

  return (
    <div className="ai-chat-page" style={{ backgroundColor: meta.cardBg }}>
      <ChatHeader />

      <div className="ai-chat-body">
        <div className="ai-mode-pill" style={{ backgroundColor: '#f9e8c9', borderColor: meta.accent }}>
          <span className="ai-mode-arrow">▼</span>
          <span>{meta.label}</span>
        </div>

        <div className="ai-chat-messages">
          {intro.map((text, idx) => (
            <ChatBubble key={`intro-${idx}`} text={text} background={meta.bubble} />
          ))}
          {conversation.map((msg, idx) => (
            <ChatBubble
              key={`${msg.sender}-${idx}`}
              text={msg.text}
              background={msg.sender === 'user' ? '#D9D9D9' : meta.bubble}
              align={msg.sender === 'user' ? 'right' : 'left'}
            />
          ))}
        </div>
      </div>

      <ChatInput
        placeholder={`${meta.label}에게 무엇이든 물어보세요!`}
        buttonColor={meta.send}
      />

      <BottomTabBar activeTab="토닥 AI" />

      <div className="ai-chat-backdrop" onClick={() => navigate('/ai')} aria-hidden />
    </div>
  );
}

export default AiChatPage;
