import HeroSection from '../components/home/HeroSection';
import BabyCard from '../components/home/BabyCard';
import InsightCard from '../components/home/InsightCard';
import CommunityPreview from '../components/home/CommunityPreview';
import BottomTabBar from '../components/home/BottomTabBar';
import './HomePage.css';

function HomePage() {
  // Mock data
  const childData = {
    name: '김태우',
    age: '생후 7개월',
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <HeroSection childName="태우" />
        <BabyCard childData={childData} />
        <InsightCard />
        <CommunityPreview />
      </div>
      <BottomTabBar activeTab="홈" />
    </div>
  );
}

export default HomePage;
