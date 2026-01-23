import { useState } from 'react';
import sendIcon from '../../assets/WJ/send.png';
import './ChatInput.css';

function ChatInput({ placeholder, buttonColor, onSend, disabled = false }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend?.(value);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-bar">
      <input
        className="chat-input-field"
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="chat-input-send"
        style={{ backgroundColor: buttonColor, opacity: disabled ? 0.6 : 1 }}
        aria-label="메시지 전송"
        onClick={handleSend}
        disabled={disabled}
      >
        <img src={sendIcon} alt="전송" className="chat-input-icon" />
      </button>
    </div>
  );
}

export default ChatInput;
