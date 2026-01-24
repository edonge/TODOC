import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import BottomTabBar from '../components/home/BottomTabBar';
import { AI_MODES, introMessages } from '../data/aiChats';
import { sendAiMessage } from '../api/aiClient';
import { upsertSession, getSession } from '../utils/aiSessionStore';
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
    if (sessionIdParam) {
      const saved = getSession(sessionIdParam);
      if (saved && saved.messages) {
        setMessages(saved.messages);
        setSessionId(saved.id);
        return;
      }
    }
    setMessages([{ id: `intro-${meta.id}`, sender: 'ai', text: introText, background: meta.bubble }]);
    setSessionId(sessionIdParam);
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

      upsertSession({
        id: nextSessionId,
        mode: meta.id,
        title: res?.title || text.slice(0, 30),
        question_snippet: res?.question_snippet || text.slice(0, 80),
        date_label: res?.date_label || '',
        messages: newMessages,
      });
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
