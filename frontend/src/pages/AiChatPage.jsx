import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ChatHeader from '../components/ai/ChatHeader';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import BottomTabBar from '../components/home/BottomTabBar';
import { AI_MODES, introMessages } from '../data/aiChats';
import { sendAiMessage, getAiSession } from '../api/aiClient';
import './AiChatPage.css';

const meta = AI_MODES.chat;
const introText = introMessages.chat.join('\n\n');

// sticky 헤더 높이 + 여유 간격
const HEADER_OFFSET = 92;

function AiChatPage() {
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const location = useLocation();

  const [messages, setMessages] = useState([
    { id: 'intro', sender: 'ai', text: introText, background: meta.bubble },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(sessionIdParam);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const hasAutoSubmitted = useRef(false);
  const messagesEndRef = useRef(null);    // 유저 전송 시 자동스크롤용 앵커
  const lastAiMsgRef = useRef(null);      // 새 답변 보기 버튼용 — 마지막 AI 버블 상단
  const shouldScrollRef = useRef(false);
  const prevIsSendingRef = useRef(false);

  // 유저 전송 직후 → 최하단 스크롤
  useEffect(() => {
    if (shouldScrollRef.current) {
      shouldScrollRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // AI 응답 완료 → 스크롤 버튼 표시
  useEffect(() => {
    if (prevIsSendingRef.current && !isSending) {
      setShowScrollBtn(true);
    }
    prevIsSendingRef.current = isSending;
  }, [isSending]);

  // 수동으로 하단까지 스크롤 시 버튼 숨김
  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (nearBottom) setShowScrollBtn(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 버튼 클릭 → 마지막 AI 메시지 상단이 화면 상단(헤더 아래)에 오도록 스크롤
  const scrollToNewMessage = () => {
    if (lastAiMsgRef.current) {
      const top =
        lastAiMsgRef.current.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setShowScrollBtn(false);
  };

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionIdParam) {
        setMessages([{ id: 'intro', sender: 'ai', text: introText, background: meta.bubble }]);
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
        if (serverMessages.length > 0) {
          shouldScrollRef.current = true; // 이전 채팅 로드 후 최하단으로
          setMessages(serverMessages);
        } else {
          setMessages([{ id: 'intro', sender: 'ai', text: introText, background: meta.bubble }]);
        }
        setSessionId(data?.session?.id ?? sessionIdParam);
      } catch (error) {
        console.error('채팅 세션 조회 실패:', error);
        setMessages([{ id: 'intro', sender: 'ai', text: introText, background: meta.bubble }]);
        setSessionId(sessionIdParam);
      }
    };

    loadSession();
  }, [sessionIdParam]);

  // Phase 2: auto-submit transcript from voice intent routing
  useEffect(() => {
    const initial = location.state?.initialMessage;
    if (initial && !hasAutoSubmitted.current && !sessionIdParam) {
      hasAutoSubmitted.current = true;
      handleSend(initial);
    }
  }, []); // mount only

  const handleSend = async (text) => {
    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text };
    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ sender: m.sender, message: m.text }));
      const res = await sendAiMessage({ mode: 'chat', message: text, history, sessionId });
      const aiText = res?.reply || '응답을 받지 못했어요.';
      const aiDocs = res?.references || [];
      const nextSessionId = res?.session_id ?? sessionId ?? `local-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: aiText, background: meta.bubble, docs: aiDocs },
      ]);
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

  // 마지막 AI 메시지 인덱스 (로딩 버블 제외)
  const lastAiIdx = messages.reduce((acc, m, i) => (m.sender === 'ai' ? i : acc), -1);

  return (
    <div className="ai-chat-page">
      <ChatHeader />

      <div className="ai-chat-body">
        <div className="ai-chat-messages">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              ref={index === lastAiIdx ? lastAiMsgRef : null}
            >
              <ChatBubble
                text={msg.text}
                background={msg.background}
                align={msg.sender === 'user' ? 'right' : 'left'}
                docs={msg.docs || []}
              />
            </div>
          ))}
          {isSending && (
            <ChatBubble
              key="loading"
              text="생각 중..."
              background="#f0f0f0"
              align="left"
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollBtn && (
        <button className="scroll-to-bottom-btn" onClick={scrollToNewMessage}>
          ↓ 새 답변 보기
        </button>
      )}

      <ChatInput
        placeholder="토닥 AI에게 무엇이든 물어보세요!"
        buttonColor={meta.send}
        onSend={handleSend}
        disabled={isSending}
      />

      <BottomTabBar activeTab="토닥 AI" />
    </div>
  );
}

export default AiChatPage;
