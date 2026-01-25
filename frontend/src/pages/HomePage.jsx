import { useState, useEffect } from 'react';
import { apiFetch } from '../api/base';
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

      const response = await apiFetch('/api/users/me/home-data', {
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
      const response = await apiFetch('/api/community/posts/popular');
      if (response.ok) {
        const data = await response.json();
        setPopularPost(data);
      }
    } catch (error) {
      console.error('인기글 조회 실패:', error);
    }
  };

  // 한국 성씨 목록
  const koreanSurnames = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
    '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남',
    '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민',
    '나', '진', '지', '엄', '채', '원', '천', '방', '공', '현',
    '함', '변', '염', '석', '선', '설', '마', '길', '연', '위',
    '표', '명', '기', '반', '왕', '금', '옥', '육', '인', '맹',
    '제', '모', '탁', '국', '여', '어', '은', '편', '경', '봉',
    '사', '부', '가', '복', '태', '피', '감', '판', '빈', '도',
    '두', '등', '라', '란', '랑', '래', '로', '록', '롱', '뢰',
  ];

  // 이름에서 호칭 만들기 (성씨 데이터베이스 활용)
  const getCallName = (fullName) => {
    if (!fullName) return '아이';

    let nameOnly;

    // 3글자 이상이고 첫 글자가 성씨인 경우 → 성 제외
    if (fullName.length >= 3 && koreanSurnames.includes(fullName[0])) {
      nameOnly = fullName.slice(1);
    } else {
      // 그 외의 경우 (2글자 이하이거나 첫 글자가 성씨가 아닌 경우) → 전체 사용
      nameOnly = fullName;
    }

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
