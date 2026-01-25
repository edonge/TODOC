import { apiFetch } from './base';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function sendAiMessage({ mode, message, history = [], kidId = null, sessionId = null }) {
  const res = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

export async function listAiSessions() {
  const res = await apiFetch('/api/ai/sessions', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '세션 조회 실패');
  }
  return res.json();
}

export async function getAiSession(sessionId) {
  const res = await apiFetch(`/api/ai/sessions/${sessionId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '세션 조회 실패');
  }
  return res.json();
}
