import photoMom from '../../assets/photos/photo_mom.png';
import './CommunityPreview.css';

function CommunityPreview({ popularPost }) {
  // 상대 시간 계산
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 인기글이 없는 경우
  if (!popularPost) {
    return (
      <div className="community-preview-stack">
        <section className="community-preview">
          <h2 className="community-title">최근 인기글</h2>
          <div className="community-post">
            <div className="community-post-body">
              <p className="post-content empty">아직 인기글이 없습니다</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const authorName = popularPost.author?.nickname || popularPost.author?.username || '익명';

  return (
    <div className="community-preview-stack">
      <section className="community-preview">
        <h2 className="community-title">최근 인기글</h2>

        <div className="community-post">
          <div className="post-header">
            <img
              src={popularPost.author?.profile_image_url || photoMom}
              alt="프로필"
              className="post-avatar"
            />
            <div className="post-info">
              <span className="post-author">{authorName}</span>
              <span className="post-date">{getRelativeTime(popularPost.created_at)}</span>
            </div>
          </div>

          <div className="community-post-body">
            <p className="post-content">
              {popularPost.content}
              {popularPost.content && popularPost.content.length > 50 && (
                <span className="more-link">더보기</span>
              )}
            </p>

            <div className="post-stats">
              <span className="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke="#AAAAAA" strokeWidth="1.5"/>
                </svg>
                {popularPost.likes_count || 0}
              </span>
              <span className="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {popularPost.comment_count || 0}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CommunityPreview;
