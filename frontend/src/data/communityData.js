// 카테고리 목록
export const categories = ['전체', '일반', '고민', '장터'];

// 카테고리별 색상 (카드 후면 장식 레이어용)
export const categoryColors = {
  '전체': '#FFFFFF',
  '일반': '#EFC3C8',
  '고민': '#6F99F4',
  '장터': '#DDD6F3',
};

// 프론트엔드 카테고리 → 백엔드 enum 매핑
export const categoryToEnum = {
  '일반': 'general',
  '고민': 'concern',
  '장터': 'market',
};

// 백엔드 enum → 프론트엔드 카테고리 매핑
export const enumToCategory = {
  'general': '일반',
  'concern': '고민',
  'market': '장터',
};

// 시간 포맷 함수
export function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${Math.floor(diffDays / 7)}주 전`;
}
