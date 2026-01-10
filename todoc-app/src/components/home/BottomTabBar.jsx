import homeIcon from '../../assets/icons/Home.png';
import communityIcon from '../../assets/icons/community.png';
import recordIcon from '../../assets/icons/record.png';
import aiIcon from '../../assets/icons/TodocAI.png';
import './BottomTabBar.css';

function BottomTabBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: '홈', icon: homeIcon },
    { id: 'community', label: '커뮤니티', icon: communityIcon },
    { id: 'record', label: '일지', icon: recordIcon },
    { id: 'ai', label: '토닥 AI', icon: aiIcon },
  ];

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="tab-icon-wrapper">
            <img
              src={tab.icon}
              alt={tab.label}
              className={`tab-icon ${tab.id === 'ai' ? 'tab-icon-color' : ''}`}
            />
          </div>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomTabBar;
