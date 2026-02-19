import { useState } from 'react';
import './ChatBubble.css';

function ChatBubble({ text, align = 'left', background, isIntro = false, docs = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

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
                <div key={i} className="chat-bubble-doc-chip-wrapper">
                  <span
                    className="chat-bubble-doc-chip"
                    onClick={() => handleChipClick(i)}
                  >
                    {doc}
                  </span>
                  {activeTooltip === i && (
                    <div className="chat-bubble-doc-tooltip">{doc}</div>
                  )}
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
