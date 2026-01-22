import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './EtcCard.css';

function EtcCard({ data }) {
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
    alert(`기타 ${action}`);
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
            <span className="header-text-plain">최근 기타 기록</span>
            <span className="header-sub">마지막 기록 : {data.lastRecord || '없음'}</span>
          </div>
        </div>
        <div className="etc-records-wrapper">
          <div className="etc-records">
            {data.records.map((record, idx) => (
              <div key={idx} className="etc-record-item">
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

export default EtcCard;
