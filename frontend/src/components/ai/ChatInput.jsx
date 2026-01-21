import sendIcon from '../../assets/WJ/send.png';
import './ChatInput.css';

function ChatInput({ placeholder, buttonColor }) {
  return (
    <div className="chat-input-bar">
      <input
        className="chat-input-field"
        type="text"
        placeholder={placeholder}
      />
      <button
        className="chat-input-send"
        style={{ backgroundColor: buttonColor }}
        aria-label="메시지 전송"
      >
        <img src={sendIcon} alt="전송" className="chat-input-icon" />
      </button>
    </div>
  );
}

export default ChatInput;
