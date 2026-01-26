import { useState, useEffect, useRef } from 'react';
import { getComments, createComment, deleteComment, togglePostLike } from '../../api/communityClient';
import { formatMomName } from '../../data/communityData';
import todocCharacter from '../../assets/characters/todoc_character.png';
import './PostDetailModal.css';

function PostDetailModal({ post, categoryColor, formatTimeAgo, onClose, onLikeUpdate, onCommentCountUpdate, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const commentsRef = useRef(null);

  const avatarSrc = post.authorImage || todocCharacter;

  // 댓글 목록 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(post.id);
        setComments(data.comments || []);
        setCommentCount(data.total || 0);
        // 실제 댓글 수로 부모 컴포넌트 업데이트
        if (onCommentCountUpdate && data.total !== post.commentCount) {
          onCommentCountUpdate(post.id, data.total);
        }
      } catch (error) {
        console.error('댓글 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [post.id]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (!commentsRef.current) return;
    commentsRef.current.scrollTop = 0;
  }, [loading, comments.length]);

  // 배경 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 좋아요 토글
  const handleLikeClick = async () => {
    try {
      const data = await togglePostLike(post.id);
      setIsLiked(data.is_liked);
      setLikeCount(data.likes_count);
      if (onLikeUpdate) {
        onLikeUpdate(post.id, data.is_liked, data.likes_count);
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
      if (error.message.includes('401')) {
        alert('로그인이 필요합니다.');
      }
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await createComment(post.id, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      const newCount = commentCount + 1;
      setCommentCount(newCount);
      // 부모 컴포넌트에 댓글 수 변경 알림
      if (onCommentCountUpdate) {
        onCommentCountUpdate(post.id, newCount);
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.message.includes('401')) {
        alert('로그인이 필요합니다.');
      } else {
        alert('댓글 작성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;

    try {
      await deleteComment(commentId);
      const newComments = comments.filter(c => c.id !== commentId);
      setComments(newComments);
      const newCount = commentCount - 1;
      setCommentCount(newCount);
      // 부모 컴포넌트에 댓글 수 변경 알림
      if (onCommentCountUpdate) {
        onCommentCountUpdate(post.id, newCount);
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 날짜 포맷
  const formatCommentTime = (dateString) => {
    if (!dateString) return '';
    return formatTimeAgo(dateString);
  };

  return (
    <div className="post-detail-backdrop" onClick={handleBackdropClick}>
      <div className="post-detail-modal" ref={modalRef}>
        {/* 닫기 버튼 */}
        <button className="post-detail-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 게시글 내용 */}
        <div className="post-detail-content">
          {/* 헤더 */}
          <div className="post-detail-header">
            <img
              src={avatarSrc}
              alt="프로필"
              className="post-detail-avatar"
            />
            <div className="post-detail-info">
              <span className="post-detail-author">{post.author}</span>
              <span className="post-detail-date">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <span
              className="post-detail-category"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
          </div>

          {/* 본문 */}
          <div className="post-detail-body">
            <h2 className="post-detail-title">{post.title}</h2>
            <p className="post-detail-text">{post.content}</p>
          </div>

          {/* 좋아요/댓글 수 */}
          <div className="post-detail-stats">
            <button
              type="button"
              className={`post-detail-stat post-detail-like ${isLiked ? 'liked' : ''}`}
              onClick={handleLikeClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? '#FF6B6B' : 'none'}>
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke={isLiked ? '#FF6B6B' : '#AAAAAA'} strokeWidth="1.5"/>
              </svg>
              {likeCount}
            </button>
            <span className="post-detail-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {commentCount}
            </span>
          </div>
        </div>

        {/* 댓글 영역 */}
        <div className="post-detail-comments" ref={commentsRef}>
          <h3 className="comments-title">댓글 {commentCount}개</h3>

          {loading ? (
            <div className="comments-loading">댓글을 불러오는 중...</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</div>
          ) : (
            <div className="comments-list">
              {[...comments].reverse().map((comment) => (
                <div key={comment.id} className="comment-item">
                  <img
                    src={comment.author?.profile_image_url || todocCharacter}
                    alt="프로필"
                    className="comment-avatar"
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">
                        {formatMomName(comment.kid_name) || comment.author?.nickname || '익명'}
                      </span>
                      <span className="comment-date">{formatCommentTime(comment.created_at)}</span>
                      {currentUserId && comment.user_id === currentUserId && (
                        <button
                          className="comment-delete"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 댓글 입력 */}
        <form className="comment-input-form" onSubmit={handleCommentSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            className="comment-submit"
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? '...' : '등록'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostDetailModal;
