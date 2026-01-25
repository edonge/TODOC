import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './EtcCard.css';

function EtcCard({ data, headerTitle, headerSub, emptyLines, onEdit, onDelete }) {
  const [openRecordMenu, setOpenRecordMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);

  const hasRecords = data && data.records && data.records.length > 0;
  const titleText = headerTitle || '최근 기타 기록';
  const subText = headerSub || `마지막 기록 : ${data?.lastRecord || '-'}`;
  const emptyTextLines = emptyLines || [
    '아직 기록된 내용이 없어요.',
    '특별한 순간이나 메모를',
    '자유롭게 기록해 보세요.',
  ];

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
      <div className="record-card-label etc">기타</div>
      <CardStack backColor="#8F8F8F">
        <div className="record-card-header">
          <div className="header-inline">
            <span className="header-text-plain">{titleText}</span>
            <span className="header-sub">{subText}</span>
          </div>
        </div>
        <div className="etc-records-wrapper">
          {hasRecords ? (
            <div className="etc-records">
              {data.records.map((record, idx) => (
                <div key={record.id || idx} className="etc-record-item">
                  <span className="etc-time">{record.date}</span>
                  <span className="etc-text">{record.text}</span>
                  <div className="record-item-menu">
                    <button
                      type="button"
                      className="etc-menu-btn"
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
            <div className="etc-empty">
              {emptyTextLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </CardStack>
    </div>
  );
}

export default EtcCard;
