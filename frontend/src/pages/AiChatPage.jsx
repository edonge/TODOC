import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import BottomTabBar from '../components/home/BottomTabBar';
import { AI_MODES, introMessages } from '../data/aiChats';
import './AiChatPage.css';

function AiChatPage() {
  const { mode } = useParams();
  const meta = useMemo(() => AI_MODES[mode] ?? AI_MODES.mom, [mode]);
  const intro = introMessages[meta.id] ?? introMessages.mom;
  const introText = intro.join('\n\n');

  return (
    <div className="ai-chat-page">
      <ChatHeader />

      <div className="ai-chat-body">
        <div className="ai-chat-messages">
          <ChatBubble text={introText} background={meta.bubble} isIntro />
        </div>
      </div>

      <ChatInput
        placeholder={`${meta.label}에게 무엇이든 물어보세요!`}
        buttonColor={meta.send}
      />

      <BottomTabBar activeTab="토닥 AI" />
    </div>
  );
}

export default AiChatPage;
