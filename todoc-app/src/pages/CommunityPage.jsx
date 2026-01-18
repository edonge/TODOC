import { useState, useEffect } from 'react';
import { initialPosts, categories, categoryColors, formatTimeAgo } from '../data/communityData';
import PostCard from '../components/community/PostCard';
import WritePostModal from '../components/community/WritePostModal';
import BottomTabBar from '../components/home/BottomTabBar';
import './CommunityPage.css';

function CommunityPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('인기순');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [authorName, setAuthorName] = useState('태우맘');

  // localStorage에서 아이 이름 불러와서 작성자명 설정
  useEffect(() => {
    const childName = localStorage.getItem('childName');
    if (childName) {
      // 성 제외하고 이름만 사용 (2글자 이상이면 첫 글자 제외)
      const nameOnly = childName.length > 1 ? childName.slice(1) : childName;
      setAuthorName(`${nameOnly}맘`);
    }
  }, []);

  // 카테고리 필터링
  const filteredPosts = selectedCategory === '전체'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  // 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === '인기순') {
      return b.likeCount - a.likeCount;
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // 게시글 추가
  const handleAddPost = (newPost) => {
    const post = {
      id: Date.now(),
      ...newPost,
      author: authorName,
      authorImage: null,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      isMyPost: true,
    };
    setPosts([post, ...posts]);
    setShowWriteModal(false);
    // 새 글 작성 후 최신순으로 변경하여 바로 보이도록
    setSortBy('최신순');
  };

  return (
    <div className="community-page">
      {/* 카테고리 탭 */}
      <div className="category-tabs">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              className={`category-tab ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              style={isActive ? { backgroundColor: categoryColors[category] } : undefined}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* 글 추가 버튼 + 정렬 */}
      <div className="post-actions">
        <button
          className="add-post-btn"
          onClick={() => setShowWriteModal(true)}
        >
          글 추가하기
        </button>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="인기순">인기순</option>
          <option value="최신순">최신순</option>
        </select>
      </div>

      {/* 게시글 목록 */}
      <div className="posts-list">
        {sortedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            categoryColor={categoryColors[post.category]}
            formatTimeAgo={formatTimeAgo}
          />
        ))}
      </div>

      {/* 글 작성 모달 */}
      {showWriteModal && (
        <WritePostModal
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleAddPost}
          categories={categories.filter(c => c !== '전체')}
        />
      )}

      <BottomTabBar activeTab="커뮤니티" />
    </div>
  );
}

export default CommunityPage;
