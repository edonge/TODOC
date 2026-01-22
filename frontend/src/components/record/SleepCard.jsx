import { useEffect, useRef, useState } from 'react';
import CardStack from '../common/CardStack';
import moreIcon from '../../assets/icons/more.png';
import './SleepCard.css';

function SleepCard({ records = [] }) {
  const [openRecordMenu, setOpenRecordMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);
  // 종료일 기준으로 총 수면시간 계산 (시간 단위)
  const calculateTotalHours = () => {
    if (!records || records.length === 0) return 0;

    let totalMinutes = 0;
    records.forEach(record => {
      // duration이 "7h", "4h 30m" 형식일 경우 파싱
      const hours = record.duration.match(/(\d+)h/);
      const minutes = record.duration.match(/(\d+)m/);

      if (hours) totalMinutes += parseInt(hours[1]) * 60;
      if (minutes) totalMinutes += parseInt(minutes[1]);
    });

    return Math.round(totalMinutes / 60);
  };

  const totalHours = calculateTotalHours();
  const hasRecords = records && records.length > 0;

  const handleRecordMenuToggle = (e, index) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.right });
    setOpenRecordMenu(openRecordMenu === index ? null : index);
  };

  const handleRecordMenuAction = (action) => {
    alert(`수면 ${action}`);
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
      <div className="record-card-label sleep">수면</div>
      <CardStack backColor="#FFF2DB">
        <div className="sleep-card-header">
          <span className="sleep-header-text">오늘의 수면 : {totalHours}시간</span>
        </div>

        <div className="sleep-records-wrapper">
          {hasRecords ? (
            <div className="sleep-records">
              {records.map((record, idx) => (
                <div key={idx} className="sleep-record-box">
                  <span className={`sleep-type-label ${record.type === '밤잠' ? 'night' : 'day'}`}>{record.type}</span>
                  <span className="sleep-time">{record.start} - {record.end}</span>
                  <span className="sleep-duration">{record.duration}</span>
                  <span className="sleep-dot" style={{ backgroundColor: record.color }}></span>
                  <div className="record-item-menu">
                    <button
                      type="button"
                      className="sleep-menu-btn"
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
          ) : (
            <div className="sleep-empty">
              <p>아직 기록된 수면이 없어요.</p>
              <p>밤잠이나 낮잠을 기록해 두면</p>
              <p>자동으로 하루를 정리해 드릴게요.</p>
            </div>
          )}
        </div>
      </CardStack>
    </div>
  );
}

export default SleepCard;
