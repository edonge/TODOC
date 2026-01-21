import './ChatBubble.css';

function ChatBubble({ text, align = 'left', background, isIntro = false }) {
  return (
    <div className={`chat-bubble-row ${align === 'right' ? 'align-right' : ''}`}>
      <div
        className={`chat-bubble ${isIntro ? 'intro' : ''}`}
        style={{ backgroundColor: background }}
      >
        {text}
      </div>
    </div>
  );
}

export default ChatBubble;
