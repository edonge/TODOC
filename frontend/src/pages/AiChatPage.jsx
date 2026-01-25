import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import BottomTabBar from '../components/home/BottomTabBar';
import { AI_MODES, introMessages } from '../data/aiChats';
import { sendAiMessage, getAiSession } from '../api/aiClient';
import './AiChatPage.css';

function AiChatPage() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const meta = useMemo(() => AI_MODES[mode] ?? AI_MODES.mom, [mode]);
  const introText = (introMessages[meta.id] ?? introMessages.mom).join('\n\n');

  const [messages, setMessages] = useState([
    { id: 'intro', sender: 'ai', text: introText, background: meta.bubble },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(sessionIdParam);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionIdParam) {
        setMessages([{ id: `intro-${meta.id}`, sender: 'ai', text: introText, background: meta.bubble }]);
        setSessionId(null);
        return;
      }

      try {
        const data = await getAiSession(sessionIdParam);
        const serverMessages = (data?.messages || []).map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.content,
          background: msg.sender === 'ai' ? meta.bubble : undefined,
        }));
        setMessages(serverMessages.length > 0
          ? serverMessages
          : [{ id: `intro-${meta.id}`, sender: 'ai', text: introText, background: meta.bubble }]
        );
        setSessionId(data?.session?.id ?? sessionIdParam);
      } catch (error) {
        console.error('채팅 세션 조회 실패:', error);
        setMessages([{ id: `intro-${meta.id}`, sender: 'ai', text: introText, background: meta.bubble }]);
        setSessionId(sessionIdParam);
      }
    };

    loadSession();
  }, [meta.id, introText, meta.bubble, sessionIdParam]);

  const handleSend = async (text) => {
    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ sender: m.sender, message: m.text }));
      const res = await sendAiMessage({ mode: meta.id, message: text, history, sessionId });
      const aiText = res?.reply || '응답을 받지 못했어요.';
      const nextSessionId = res?.session_id ?? sessionId ?? `local-${Date.now()}`;
      const newMessages = [
        ...messages,
        userMsg,
        { id: `ai-${Date.now()}`, sender: 'ai', text: aiText, background: meta.bubble },
      ];
      setMessages(newMessages);
      setSessionId(nextSessionId);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: 'ai', text: `오류: ${err.message}`, background: '#ffe1e1' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="ai-chat-page">
      <ChatHeader />

      <div className="ai-chat-body">
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              text={msg.text}
              background={msg.background}
              align={msg.sender === 'user' ? 'right' : 'left'}
            />
          ))}
          {isSending && (
            <ChatBubble
              key="loading"
              text="생각 중..."
              background="#f0f0f0"
              align="left"
            />
          )}
        </div>
      </div>

      <ChatInput
        placeholder={`${meta.label}에게 무엇이든 물어보세요!`}
        buttonColor={meta.send}
        onSend={handleSend}
        disabled={isSending}
      />

      <BottomTabBar activeTab="토닥 AI" />
    </div>
  );
}

export default AiChatPage;
