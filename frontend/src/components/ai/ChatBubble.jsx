import { useState, useEffect } from 'react';
import './ChatBubble.css';

function ChatBubble({ text, align = 'left', background, isIntro = false, docs = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  // 칩 바깥 클릭 시 툴팁 닫기
  useEffect(() => {
    if (activeTooltip === null) return;
    const handleOutside = (e) => {
      if (!e.target.closest('.chat-bubble-doc-chip-wrapper')) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [activeTooltip]);

  const bubbleStyle = {
    backgroundColor: background ?? (align === 'right' ? '#E5E5E5' : '#F8F8F8'),
  };

  const handleChipClick = (i) => {
    setActiveTooltip(activeTooltip === i ? null : i);
  };

  return (
    <div className={`chat-bubble-row ${align === 'right' ? 'align-right' : ''}`}>
      <div className="chat-bubble-wrapper">
        <div
          className={`chat-bubble ${isIntro ? 'intro' : ''}`}
          style={bubbleStyle}
        >
          {text}
        </div>
        {docs.length > 0 && (
          <div className="chat-bubble-docs">
            <span className="chat-bubble-docs-label">📚 참고</span>
            <div className="chat-bubble-doc-chips">
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className={`chat-bubble-doc-chip-wrapper${activeTooltip === i ? ' active' : ''}`}
                >
                  <span
                    className="chat-bubble-doc-chip"
                    onClick={() => handleChipClick(i)}
                  >
                    {doc}
                  </span>
                  <div className="chat-bubble-doc-tooltip">{doc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
