import './ChatHistoryItem.css';

const modeAccent = {
  mom: '#FDA8A9',
  doctor: '#4D94CC',
  nutrition: '#8DC849',
};

const modeLabel = {
  mom: '맘 AI',
  doctor: '닥터 AI',
  nutrition: '영양 AI',
};

function ChatHistoryItem({ item }) {
  const accent = modeAccent[item.mode] ?? '#999';
  const label = modeLabel[item.mode] ?? 'AI';
  return (
    <div className="chat-history-card">
      <div className="chat-history-accent" style={{ backgroundColor: accent }} />
      <div className="chat-history-body">
        <div className="chat-history-top">
          <h3 className="chat-history-title">{item.title}</h3>
          <div className="chat-history-date">{item.dateLabel}</div>
        </div>
        <div className="chat-history-question">{item.question}</div>
        <div className="chat-history-mode-row">
          <span className="chat-history-mode">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default ChatHistoryItem;
