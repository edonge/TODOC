import { useEffect } from 'react';
import VoiceRecordButton from '../common/VoiceRecordButton';
import './RecordCategoryModal.css';

function RecordCategoryModal({ onClose, onSelectCategory, kidId, onVoiceResult }) {
  // 스크롤 방지
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const categories = [
    { id: 'sleep', name: '수면' },
    { id: 'meal', name: '식사' },
    { id: 'growth', name: '성장' },
    { id: 'health', name: '건강' },
    { id: 'diaper', name: '배변' },
    { id: 'etc', name: '기타' },
  ];

  const handleCategoryClick = (category) => {
    onSelectCategory(category);
  };

  return (
    <div className="record-modal-overlay" onClick={onClose}>
      <div className="record-modal" onClick={(e) => e.stopPropagation()}>
        <div className="record-modal-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`record-modal-item record-modal-item--${category.id}`}
              onClick={() => handleCategoryClick(category)}
            >
              <div className="record-modal-strip">
                <span className="record-modal-plus">+</span>
              </div>
              <span className="record-modal-name">{category.name}</span>
            </button>
          ))}
        </div>

        {kidId && onVoiceResult && (
          <div className="record-modal-voice-area">
            <VoiceRecordButton
              kidId={kidId}
              onResult={onVoiceResult}
              inline
              className="voice-record-wrapper--modal"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RecordCategoryModal;
