import { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import BabyCard from '../components/home/BabyCard';
import InsightCard from '../components/home/InsightCard';
import CommunityPreview from '../components/home/CommunityPreview';
import BottomTabBar from '../components/home/BottomTabBar';
import './HomePage.css';

function HomePage() {
  const [childData, setChildData] = useState({
    name: '',
    birthday: null,
  });
  const [recentRecord, setRecentRecord] = useState(null);
  const [popularPost, setPopularPost] = useState(null);

  useEffect(() => {
    // localStorage에서 아이 정보 가져오기 (온보딩에서 저장한 정보)
    const savedName = localStorage.getItem('childName');
    const savedBirthday = localStorage.getItem('childBirthday');

    if (savedName) {
      setChildData({
        name: savedName,
        birthday: savedBirthday ? new Date(savedBirthday) : null,
      });
    }

    // API에서 홈 데이터 가져오기 (DB에 등록된 아이 정보 및 최근 기록)
    fetchHomeData();
    // 인기글 가져오기
    fetchPopularPost();
  }, []);

  const fetchHomeData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/users/me/home-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // DB에 등록된 아이 정보가 있으면 사용
        if (data.kid) {
          setChildData({
            name: data.kid.name,
            birthday: data.kid.birthday ? new Date(data.kid.birthday) : null,
          });
        }

        // 최근 기록 설정
        if (data.recent_record) {
          setRecentRecord(data.recent_record);
        }
      }
    } catch (error) {
      console.error('홈 데이터 조회 실패:', error);
    }
  };

  const fetchPopularPost = async () => {
    try {
      const response = await fetch('/api/community/posts/popular');
      if (response.ok) {
        const data = await response.json();
        setPopularPost(data);
      }
    } catch (error) {
      console.error('인기글 조회 실패:', error);
    }
  };

  // 이름에서 호칭 만들기 (받침 유무에 따라 '이' 추가)
  const getCallName = (fullName) => {
    if (!fullName) return '아이';
    // 성을 제외한 이름만 추출 (이름이 2자 이상이면 첫 글자 제외)
    const nameOnly = fullName.length > 1 ? fullName.slice(1) : fullName;
    const lastChar = nameOnly[nameOnly.length - 1];
    const code = lastChar.charCodeAt(0) - 0xac00;

    // 한글이 아닌 경우
    if (code < 0 || code > 11171) {
      return nameOnly;
    }

    // 받침 유무 확인
    const hasBatchim = code % 28 !== 0;
    return hasBatchim ? `${nameOnly}이` : nameOnly;
  };

  const callName = getCallName(childData.name);

  return (
    <div className="home-container">
      <div className="home-content">
        <HeroSection childName={callName} />
        <BabyCard childData={childData} recentRecord={recentRecord} />
        <InsightCard />
        <CommunityPreview popularPost={popularPost} />
      </div>
      <BottomTabBar activeTab="홈" />
    </div>
  );
}

export default HomePage;
