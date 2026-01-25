import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './MealCard.css';

function MealCard({ records = [], onEdit, onDelete }) {
  const [openRecordMenu, setOpenRecordMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);

  const totalCount = records.length;
  const hasRecords = records && records.length > 0;

  const handleRecordMenuToggle = (e, index) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.right });
    setOpenRecordMenu(openRecordMenu === index ? null : index);
  };

  const handleRecordMenuAction = (action, record) => {
    if (action === '수정하기' && onEdit) {
      onEdit(record);
    }
    if (action === '삭제하기' && onDelete) {
      onDelete(record);
    }
    setOpenRecordMenu(null);
  };

  useEffect(() => {
    if (openRecordMenu === null) return;
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setOpenRecordMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openRecordMenu]);

  return (
    <div className="record-card" onClick={() => setOpenRecordMenu(null)} ref={cardRef}>
      <div className="record-card-label meal">식사</div>
      <CardStack backColor="#DBD0BC">
        <div className="meal-card-header">
          <span className="meal-header-text">오늘의 식사 : 총 {totalCount}회</span>
        </div>

        <div className="meal-card-records-wrapper">
          {hasRecords ? (
            <div className="meal-card-records">
              {records.map((record, idx) => (
                <div key={idx} className="meal-card-record-item">
                  <span className="meal-card-time">{record.time}</span>
                  <span className="meal-card-type">{record.type}</span>
                  <span className="meal-card-amount">{record.amount}</span>
                  <span className="meal-card-burp">{record.burp || '트림 O'}</span>
                  <span className="meal-card-dot" aria-hidden="true"></span>
                  <div className="record-item-menu">
                    <button
                      type="button"
                      className="meal-card-menu-btn"
                      onClick={(e) => handleRecordMenuToggle(e, idx)}
                    >
                      <img src={moreIcon} alt="더보기" className="menu-icon" />
                    </button>
                    {openRecordMenu === idx && (
                      <div
                        className="menu-dropdown"
                        style={{
                          position: 'fixed',
                          top: menuPosition.top,
                          left: menuPosition.left,
                          transform: 'translateX(-100%)',
                          zIndex: 1000,
                        }}
                      >
                        <button onClick={() => handleRecordMenuAction('수정하기', record.raw)}>수정하기</button>
                        <button onClick={() => handleRecordMenuAction('삭제하기', record.raw)}>삭제하기</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="meal-empty">
              <p>아직 기록된 식사가 없어요.</p>
              <p>모유, 분유, 이유식 등을 기록해 보세요.</p>
            </div>
          )}
        </div>
      </CardStack>
    </div>
  );
}

export default MealCard;
