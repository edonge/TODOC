const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function sendAiMessage({ mode, message, history = [], kidId = null, sessionId = null }) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      message,
      history,
      kid_id: kidId,
      session_id: sessionId,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'AI 요청 실패');
  }
  return res.json(); // { reply: string }
}
