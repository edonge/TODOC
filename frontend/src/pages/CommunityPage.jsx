import { useState, useEffect, useCallback } from 'react';
import { withApiBase } from '../api/base';
import { categories, categoryColors, formatTimeAgo, categoryToEnum, enumToCategory } from '../data/communityData';
import PostCard from '../components/community/PostCard';
import WritePostModal from '../components/community/WritePostModal';
import BottomTabBar from '../components/home/BottomTabBar';
import './CommunityPage.css';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('인기순');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // 게시글 목록 조회
  const fetchPosts = useCallback(async (resetPage = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const currentPage = resetPage ? 1 : page;

      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', '20');

      // 카테고리 필터
      if (selectedCategory !== '전체') {
        const categoryEnum = categoryToEnum[selectedCategory];
        if (categoryEnum) {
          params.append('category', categoryEnum);
        }
      }

      // 정렬
      if (sortBy === '인기순') {
        params.append('sort_by', 'likes_count');
      } else {
        params.append('sort_by', 'created_at');
      }
      params.append('sort_order', 'desc');

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(withApiBase(`/api/community/posts?${params.toString()}`), {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        // API 응답을 프론트엔드 형식으로 변환
        const transformedPosts = data.posts.map(post => ({
          id: post.id,
          category: enumToCategory[post.category] || post.category,
          title: post.title,
          content: post.content,
          author: post.author?.nickname || post.author?.username || '익명',
          authorImage: post.author?.profile_image_url,
          createdAt: post.created_at,
          likeCount: post.likes_count || 0,
          commentCount: post.comment_count || 0,
          isLiked: post.is_liked || false,
        }));

        if (resetPage) {
          setPosts(transformedPosts);
          setPage(1);
        } else {
          setPosts(prev => [...prev, ...transformedPosts]);
        }
        setHasNext(data.has_next);
      }
    } catch (error) {
      console.error('게시글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, page]);

  // 초기 로드 및 필터/정렬 변경 시
  useEffect(() => {
    fetchPosts(true);
  }, [selectedCategory, sortBy]);

  // 게시글 작성
  const handleAddPost = async (newPost) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const categoryEnum = categoryToEnum[newPost.category];

      const response = await fetch(withApiBase('/api/community/posts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: categoryEnum,
          title: newPost.title,
          content: newPost.content,
        }),
      });

      if (response.ok) {
        setShowWriteModal(false);
        setSortBy('최신순');
        fetchPosts(true);
      } else {
        const error = await response.json();
        alert(error.detail || '게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성에 실패했습니다.');
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async (postId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(withApiBase(`/api/community/posts/${postId}/like`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 로컬 상태 업데이트
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, isLiked: data.is_liked, likeCount: data.likes_count }
            : post
        ));
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
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
        {loading && posts.length === 0 ? (
          <div className="loading-message">로딩 중...</div>
        ) : posts.length === 0 ? (
          <div className="empty-message">게시글이 없습니다.</div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              categoryColor={categoryColors[post.category]}
              formatTimeAgo={formatTimeAgo}
              onLikeToggle={handleLikeToggle}
            />
          ))
        )}
        {hasNext && !loading && (
          <button
            className="load-more-btn"
            onClick={() => {
              setPage(prev => prev + 1);
              fetchPosts(false);
            }}
          >
            더보기
          </button>
        )}
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
