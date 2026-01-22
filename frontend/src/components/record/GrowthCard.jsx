import { useEffect, useRef, useState } from 'react';
import moreIcon from '../../assets/icons/more.png';
import CardStack from '../common/CardStack';
import './GrowthCard.css';

function GrowthCard({ data = null }) {
  const [openMenu, setOpenMenu] = useState(false);
  const cardRef = useRef(null);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setOpenMenu(!openMenu);
  };

  const handleMenuAction = (action) => {
    alert(`성장 ${action}`);
    setOpenMenu(false);
  };

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const hasData = data !== null;

  return (
    <div className="record-card" onClick={() => setOpenMenu(false)} ref={cardRef}>
      <div className="record-card-label growth">성장</div>
      <CardStack backColor="#328B6D">
        <div className="growth-card-header">
          <div className="growth-header-left">
            <span className="growth-header-title">최근 성장 기록</span>
            <span className="growth-header-sub">
              마지막 기록 : {hasData ? data.lastRecord : '-'}
            </span>
          </div>
          <div className="growth-card-menu">
            <button className="menu-trigger" onClick={handleMenuToggle}>
              <img src={moreIcon} alt="더보기" className="menu-icon" />
            </button>
            {openMenu && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuAction('수정하기')}>수정하기</button>
                <button onClick={() => handleMenuAction('삭제하기')}>삭제하기</button>
              </div>
            )}
          </div>
        </div>

        <div className="growth-content-wrapper">
          {hasData ? (
            <div className="growth-content">
              <div className="growth-stats-column">
                <div className="growth-stat-box">
                  <span className="growth-stat-label">키</span>
                  <span className="growth-stat-num">
                    {data.height.value} cm
                  </span>
                  <span className={`growth-stat-change ${data.height.change.startsWith('+') ? 'positive' : 'negative'}`}>
                    ({data.height.change})
                  </span>
                </div>
                <div className="growth-stat-box">
                  <span className="growth-stat-label">몸무게</span>
                  <span className="growth-stat-num">
                    {data.weight.value} kg
                  </span>
                  <span className={`growth-stat-change ${data.weight.change.startsWith('+') ? 'positive' : 'negative'}`}>
                    ({data.weight.change})
                  </span>
                </div>
                {data.headCircumference && (
                  <div className="growth-stat-box">
                    <span className="growth-stat-label">머리둘레</span>
                    <span className="growth-stat-num">
                      {data.headCircumference.value} cm
                    </span>
                    <span className={`growth-stat-change ${data.headCircumference.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      ({data.headCircumference.change})
                    </span>
                  </div>
                )}
              </div>
              <div className="growth-activities-box">
                <span className="growth-activities-label">활동</span>
                <div className="growth-activity-tags">
                  {data.activities.map((activity, idx) => (
                    <span key={idx} className="growth-activity-tag">{activity}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="growth-empty">
              <p>아직 기록된 성장 정보가 없어요.</p>
              <p>키, 몸무게, 머리둘레를 기록해 보세요.</p>
            </div>
          )}
        </div>
      </CardStack>
    </div>
  );
}

export default GrowthCard;
