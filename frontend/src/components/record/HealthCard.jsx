import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './HealthCard.css';

function HealthCard({ data, onEdit, onDelete }) {
  const [openRecordMenu, setOpenRecordMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);
  const records = data
    ? (data.records || [
        {
          title: data.note,
          date: data.date,
          tags: [...(data.symptoms || []), ...(data.medicine || [])],
        },
      ])
    : [];

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
      <div className="record-card-label health">건강</div>
      <CardStack backColor="#8D0000">
        <div className="health-card-header">
          <div className="health-header-left">
            <span className="health-header-text">최근 건강 기록</span>
            {data && <span className="health-header-sub">마지막 기록 : {data.lastRecord}</span>}
          </div>
        </div>

        <div className="health-records-wrapper">
          {hasRecords ? (
            <div className="health-records">
              {records.map((record, idx) => (
                <div key={idx} className="health-record-box">
                  <div className="health-record-header">
                    <span className="health-record-title">{record.title}</span>
                    <span className="health-record-date">{record.date}</span>
                  </div>
                  <div className="health-record-footer">
                    <div className="health-record-tags">
                      {record.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className="health-record-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="record-item-menu">
                      <button
                        type="button"
                        className="health-record-menu-btn"
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
                </div>
              ))}
            </div>
          ) : (
            <div className="health-empty">
              <p>최근 건강 기록이 없어요.</p>
              <p>아이 컨디션이 변하면 가볍게 메모해두세요.</p>
            </div>
          )}
        </div>
      </CardStack>
    </div>
  );
}

export default HealthCard;
