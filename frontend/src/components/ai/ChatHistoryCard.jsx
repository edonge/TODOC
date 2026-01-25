import CardStack from '../common/CardStack';
import './ChatHistoryCard.css';

// AI 모드별 색상 설정
const modeConfig = {
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

function ChatHistoryCard({ session, onClick }) {
  const config = modeConfig[session.mode] ?? modeConfig.mom;

  // 날짜 포맷팅 (마지막 대화 시간)
  const formatLastDate = (dateLabel) => {
    if (!dateLabel) return '';
    return dateLabel;
  };

  return (
    <div className="chat-history-card-wrapper" onClick={onClick}>
      <CardStack backColor={config.backColor} className="chat-history-card-stack">
        <div className="chat-history-card-content">
          {/* 상단 영역: 제목 + 날짜 */}
          <div className="chat-history-card-top">
            <h3 className="chat-history-card-title">{session.title || '새 대화'}</h3>
            <span className="chat-history-card-date">{formatLastDate(session.date_label)}</span>
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
    </div>
  );
}

export default ChatHistoryCard;
