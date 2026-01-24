const STORAGE_KEY = 'todoc_ai_sessions';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load AI sessions', e);
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save AI sessions', e);
  }
}

export function listSessions() {
  return loadAll();
}

export function getSession(sessionId) {
  return loadAll().find((s) => String(s.id) === String(sessionId));
}

export function upsertSession(session) {
  const list = loadAll();
  const idx = list.findIndex((s) => String(s.id) === String(session.id));
  if (idx >= 0) list[idx] = session;
  else list.unshift(session); // 최신을 앞에
  saveAll(list);
}
