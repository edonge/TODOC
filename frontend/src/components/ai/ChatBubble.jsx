import './ChatBubble.css';

function ChatBubble({ text, align = 'left', background, isIntro = false }) {
  const bubbleStyle = {
    backgroundColor: background ?? (align === 'right' ? '#E5E5E5' : '#F8F8F8'),
  };

  return (
    <div className={`chat-bubble-row ${align === 'right' ? 'align-right' : ''}`}>
      <div
        className={`chat-bubble ${isIntro ? 'intro' : ''}`}
        style={bubbleStyle}
      >
        {text}
      </div>
    </div>
  );
}

export default ChatBubble;
