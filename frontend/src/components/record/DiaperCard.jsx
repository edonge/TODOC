import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './DiaperCard.css';

function DiaperCard({ data }) {
  const [openRecordMenu, setOpenRecordMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);

  if (!data) return null;

  const handleRecordMenuToggle = (e, index) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.right });
    setOpenRecordMenu(openRecordMenu === index ? null : index);
  };

  const handleRecordMenuAction = (action) => {
    alert(`배변 ${action}`);
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
      <div className="record-card-label diaper">배변</div>
      <CardStack backColor="#EFC3C8">
        <div className="record-card-header">
          <div className="header-inline">
            <span className="header-text-plain">최근 배변 기록</span>
            <span className="header-sub">마지막 기록 : {data.lastRecord}</span>
          </div>
        </div>
        <div className="diaper-records-wrapper">
          <div className="diaper-records">
            {data.records.map((record, idx) => (
              <div key={idx} className="diaper-record-item">
                <span className="diaper-time">{record.time}</span>
                <span className="diaper-type">{record.type}</span>
                <span className="diaper-condition">{record.condition}</span>
                <span className="diaper-dot" style={{ backgroundColor: record.color }}></span>
                <div className="record-item-menu">
                  <button
                    type="button"
                    className="diaper-menu-btn"
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
                      <button onClick={() => handleRecordMenuAction('수정하기')}>수정하기</button>
                      <button onClick={() => handleRecordMenuAction('삭제하기')}>삭제하기</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardStack>
    </div>
  );
}

export default DiaperCard;
