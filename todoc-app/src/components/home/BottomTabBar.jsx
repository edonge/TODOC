import { useNavigate } from 'react-router-dom';
import homeIcon from '../../assets/icons/Home.png';
import communityIcon from '../../assets/icons/community.png';
import recordIcon from '../../assets/icons/record.png';
import aiIcon from '../../assets/icons/TodocAI.png';
import './BottomTabBar.css';

function BottomTabBar({ activeTab }) {
  const navigate = useNavigate();

  const tabs = [
    { id: '홈', label: '홈', icon: homeIcon, path: '/home' },
    { id: '커뮤니티', label: '커뮤니티', icon: communityIcon, path: '/community' },
    { id: '일지', label: '일지', icon: recordIcon, path: '/record' },
    { id: '토닥 AI', label: '토닥 AI', icon: aiIcon, path: '/ai' },
  ];

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          <div className="tab-icon-wrapper">
            <img
              src={tab.icon}
              alt={tab.label}
              className={`tab-icon ${tab.id === '토닥 AI' ? 'tab-icon-color' : ''}`}
            />
          </div>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomTabBar;
