import { useEffect, useRef, useState } from 'react';
import todocCharacter from '../../assets/characters/todoc_character.png';
import moreIcon from '../../assets/icons/more.png';
import './PostCard.css';

function PostCard({ post, categoryColor, formatTimeAgo, onLikeToggle, isOwn, onEdit, onDelete, onCardClick }) {
  const avatarSrc = post.authorImage || todocCharacter;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle(post.id);
    }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    if (onCardClick) {
      onCardClick(post);
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(post);
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    if (onCardClick) {
      onCardClick(post);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
    setIsMenuOpen(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="post-card-stack"
      style={{ '--category-color': categoryColor }}
      onClick={handleCardClick}
    >
      <article className="post-card">
        <div className="post-card-header">
          <img
            src={avatarSrc}
            alt="프로필"
            className={`post-card-avatar ${post.authorImage ? '' : 'post-card-avatar-gray'}`}
          />
          <div className="post-card-info">
            <span className="post-card-author">{post.author}</span>
            <span className="post-card-date">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <div className="post-card-header-right">
            <span
              className="post-card-category"
              style={{ backgroundColor: categoryColor }}
            >
              {post.category}
            </span>
            {isOwn && (
              <div className="post-card-menu" ref={menuRef}>
                <button
                  type="button"
                  className="menu-trigger"
                  onClick={handleMenuToggle}
                  aria-label="게시글 메뉴"
                >
                  <img src={moreIcon} alt="더보기" className="menu-icon" />
                </button>
                {isMenuOpen && (
                  <div className="menu-dropdown">
                    <button type="button" onClick={handleEdit}>수정하기</button>
                    <button type="button" onClick={handleDelete}>삭제하기</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="post-card-body">
          <h3 className="post-card-title">{post.title}</h3>
          <p className="post-card-content">
            {post.content.length > 60
              ? `${post.content.slice(0, 60)}...`
              : post.content}
            {post.content.length > 60 && (
              <button
                type="button"
                className="post-card-more"
                onClick={handleMoreClick}
              >
                더보기
              </button>
            )}
          </p>
        </div>

        <div className="post-card-stats">
          <button
            type="button"
            className={`post-card-stat post-card-like ${post.isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-pressed={post.isLiked}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.isLiked ? '#FF6B6B' : 'none'}>
              <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke={post.isLiked ? '#FF6B6B' : '#AAAAAA'} strokeWidth="1.5"/>
            </svg>
            {post.likeCount}
          </button>
          <button
            type="button"
            className="post-card-stat post-card-comment"
            onClick={handleCommentClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {post.commentCount}
          </button>
        </div>
      </article>
    </div>
  );
}

export default PostCard;
