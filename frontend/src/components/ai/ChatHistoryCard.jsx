import { useState, useRef, useEffect } from 'react';
import CardStack from '../common/CardStack';
import moreIcon from '../../assets/icons/more.png';
import './ChatHistoryCard.css';

// AI 모드별 색상 설정 — 'chat'이 기본, 이전 세션(mom/doctor/nutrition) 하위 호환 유지
const modeConfig = {
  chat: {
    label: '토닥 AI',
    backColor: '#A89CD4',
    tagBg: '#EDE8F7',
    tagColor: '#7B6FB5',
  },
  // legacy modes — kept for existing sessions stored before the unified mode
  mom: {
    label: '맘 AI',
    backColor: '#FDA8A9',
    tagBg: '#FFE5E5',
    tagColor: '#D35656',
  },
  doctor: {
    label: '닥터 AI',
    backColor: '#4D94CC',
    tagBg: '#E3F0FA',
    tagColor: '#2D6A9F',
  },
  nutrition: {
    label: '영양 AI',
    backColor: '#8DC849',
    tagBg: '#E8F5D9',
    tagColor: '#5A8F2A',
  },
};

function ChatHistoryCard({ session, onClick, onDelete, selectMode = false, selected = false, onSelect }) {
  const config = modeConfig[session.mode] ?? modeConfig.chat;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // 날짜 포맷팅 (마지막 대화 시간)
  const formatLastDate = (dateLabel) => {
    if (!dateLabel) return '';
    return dateLabel;
  };

  const handleCardClick = (e) => {
    if (selectMode) {
      if (onSelect) onSelect(session.id);
      return;
    }
    // 메뉴가 열려있으면 닫기만 하고 네비게이션 안함
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (onClick) onClick();
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.right });
    setMenuOpen((prev) => !prev);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) {
      onDelete(session);
    }
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDownOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [menuOpen]);

  return (
    <div
      className={`chat-history-card-wrapper ${menuOpen ? 'menu-active' : ''} ${selectMode && selected ? 'is-selected' : ''}`}
      onClick={handleCardClick}
    >
      <CardStack backColor={config.backColor} className="chat-history-card-stack">
        <div className="chat-history-card-content">
          {/* 상단 영역: 제목 + 더보기(또는 체크박스) + 날짜 */}
          <div className="chat-history-card-top">
            <h3 className="chat-history-card-title">{session.title || '새 대화'}</h3>
            <div className="chat-history-card-actions">
              <span className="chat-history-card-date">{formatLastDate(session.date_label)}</span>
              {selectMode ? (
                <div className={`chat-history-select-check${selected ? ' checked' : ''}`}>
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="chat-history-menu-btn"
                  onClick={handleMenuToggle}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <img src={moreIcon} alt="더보기" className="chat-history-menu-icon" />
                </button>
              )}
            </div>
          </div>

          {/* 하단 영역: 최근 프롬프트 + AI 모드 태그 */}
          <div className="chat-history-card-bottom">
            <p className="chat-history-card-snippet">
              {session.question_snippet || ''}
            </p>
            <span
              className="chat-history-card-mode-tag"
              style={{
                backgroundColor: config.tagBg,
                color: config.tagColor,
              }}
            >
              {config.label}
            </span>
          </div>
        </div>
      </CardStack>

      {/* 드롭다운 메뉴 */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="chat-history-menu-dropdown"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            transform: 'translateX(-100%)',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleDelete}>삭제하기</button>
        </div>
      )}
    </div>
  );
}

export default ChatHistoryCard;
