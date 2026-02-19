import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ChatHeader from '../components/ai/ChatHeader';
import BottomTabBar from '../components/home/BottomTabBar';
import ChatHistoryCard from '../components/ai/ChatHistoryCard';
import { listAiSessions, deleteAiSession } from '../api/aiClient';
import './AiHomePage.css';

const SESSIONS_CACHE_KEY = 'ai_sessions_cache';

function AiHomePage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      // 캐시된 데이터 즉시 표시 (로딩 없이 바로 보여줌)
      const cached = sessionStorage.getItem(SESSIONS_CACHE_KEY);
      if (cached) {
        try { setSessions(JSON.parse(cached)); } catch { /* ignore */ }
      } else {
        setLoading(true);
      }
      try {
        const data = await listAiSessions();
        setSessions(data || []);
        sessionStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(data || []));
      } catch (error) {
        console.error('채팅 내역 조회 실패:', error);
        if (!cached) setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const updateCache = (next) =>
    sessionStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(next));

  const handleDeleteSession = async (session) => {
    if (!window.confirm('이 대화를 삭제할까요?')) return;
    try {
      await deleteAiSession(session.id);
      const next = sessions.filter((s) => s.id !== session.id);
      setSessions(next);
      updateCache(next);
    } catch (error) {
      console.error('채팅 삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개의 대화를 삭제할까요?`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteAiSession(id)));
      const next = sessions.filter((s) => !selectedIds.has(s.id));
      setSessions(next);
      updateCache(next);
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      alert('일부 삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
      handleCancelSelect();
    }
  };

  return (
    <div className="ai-home-page">
      <ChatHeader />

      <section className="ai-section">
        <h2 className="ai-section-title">새로운 채팅 시작하기</h2>
        <button
          className="ai-start-btn"
          onClick={() => navigate('/ai/chat')}
        >
          토닥 AI와 대화하기
        </button>
      </section>

      <section className="ai-section">
        <div className="ai-section-header">
          <h2 className="ai-section-title">지난 채팅 내역</h2>
          {sessions.length > 0 && (
            <button
              className="ai-select-btn"
              onClick={selectMode ? handleCancelSelect : () => setSelectMode(true)}
            >
              {selectMode ? '취소' : '선택'}
            </button>
          )}
        </div>
        {loading ? (
          <div className="ai-history-list empty-placeholder">
            <p className="ai-history-empty">채팅 내역을 불러오는 중이에요.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="ai-history-list empty-placeholder">
            <p className="ai-history-empty">아직 저장된 채팅 기록이 없어요.</p>
          </div>
        ) : (
          <div className="ai-history-list">
            {sessions.map((session) => (
              <ChatHistoryCard
                key={session.id}
                session={session}
                onClick={() => navigate(`/ai/chat?session=${session.id}`)}
                onDelete={handleDeleteSession}
                selectMode={selectMode}
                selected={selectedIds.has(session.id)}
                onSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </section>

      {selectMode && (
        <div className="ai-select-bar">
          <span className="ai-select-count">
            {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '항목을 선택하세요'}
          </span>
          <button
            className="ai-select-delete-btn"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleting}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}

      <BottomTabBar activeTab="토닥 AI" />
    </div>
  );
}

export default AiHomePage;
