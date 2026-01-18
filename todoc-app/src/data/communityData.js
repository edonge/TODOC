// 더미 게시글 데이터
export const initialPosts = [
  // 일반 카테고리
  {
    id: 1,
    category: '일반',
    title: '밤 중 수유, 다들 언제까지 하셨나요?',
    content: '제목 그대로에요. 이제 막 6개월(D+190) 진입한 아들 맘이에요. 요새 밤에 수유하는 과정에서 피로가 너무 많이 쌓여서...',
    author: '지홍맘❤️',
    authorImage: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    likeCount: 21,
    commentCount: 11,
    bookmarkCount: 3,
  },
  {
    id: 2,
    category: '일반',
    title: '아기 첫 이유식 시작했어요!',
    content: '오늘 드디어 첫 이유식을 시작했어요. 쌀미음부터 시작했는데 생각보다 잘 먹어서 너무 기뻐요. 다들 첫 이유식 어떠셨나요?',
    author: '뽀로로맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
    likeCount: 35,
    commentCount: 18,
    bookmarkCount: 7,
  },
  {
    id: 3,
    category: '일반',
    title: '아기 낮잠 루틴 어떻게 잡으셨나요?',
    content: '5개월 아기인데 낮잠 루틴이 도무지 안 잡혀요. 선배맘들 조언 부탁드려요!',
    author: '초보맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    likeCount: 28,
    commentCount: 22,
    bookmarkCount: 5,
  },
  {
    id: 4,
    category: '일반',
    title: '우리 아이 돌잔치했어요',
    content: '벌써 이렇게 크다니... 돌잡이는 연필을 잡았네요! 학자가 되려나봐요 ㅎㅎ',
    author: 'Lonely..',
    authorImage: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    likeCount: 45,
    commentCount: 31,
    bookmarkCount: 8,
  },

  // 고민 카테고리
  {
    id: 5,
    category: '고민',
    title: '아기가 밤에 자주 깨요 ㅠㅠ',
    content: '7개월 아기인데 밤에 2-3시간마다 깨서 너무 힘들어요. 수면교육을 해야 할까요? 어떻게 해야 할지 모르겠어요.',
    author: '잠못드는맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
    likeCount: 42,
    commentCount: 28,
    bookmarkCount: 12,
  },
  {
    id: 6,
    category: '고민',
    title: '분유에서 우유로 언제 바꾸나요?',
    content: '11개월인데 분유에서 우유로 바꿔도 될까요? 아직 이른가요?',
    author: '궁금이',
    authorImage: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12시간 전
    likeCount: 15,
    commentCount: 9,
    bookmarkCount: 2,
  },
  {
    id: 7,
    category: '고민',
    title: '어린이집 적응 기간이 너무 길어요',
    content: '어린이집 다닌 지 한 달이 넘었는데 아직도 울면서 가요. 다들 얼마나 걸리셨나요?',
    author: '워킹맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
    likeCount: 38,
    commentCount: 45,
    bookmarkCount: 10,
  },
  {
    id: 8,
    category: '고민',
    title: '육아 번아웃 왔어요...',
    content: '혼자 육아하다 보니 너무 지치네요. 다들 어떻게 극복하시나요? 조언 부탁드려요.',
    author: '지친맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4일 전
    likeCount: 67,
    commentCount: 52,
    bookmarkCount: 15,
  },

  // 장터 카테고리
  {
    id: 9,
    category: '장터',
    title: '유모차 나눔해요!',
    content: '딸이 4살이 넘어가서 이제 유모차를 나눔하려해요. 살때부터 좋은거 산거라 꽤 괜찮을 듯하여 나눔합니다. 관심 있으신분...',
    author: '태백군고구마',
    authorImage: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6시간 전
    likeCount: 19,
    commentCount: 33,
    bookmarkCount: 1,
  },
  {
    id: 10,
    category: '장터',
    title: '아기 옷 일괄 판매해요 (0-6개월)',
    content: '아기가 커서 못 입는 옷들 일괄 판매합니다. 상태 좋아요! 사진 댓글로 보내드릴게요.',
    author: '정리의달인',
    authorImage: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    likeCount: 12,
    commentCount: 8,
    bookmarkCount: 4,
  },
  {
    id: 11,
    category: '장터',
    title: '바운서 저렴하게 팝니다',
    content: '6개월 사용한 바운서예요. 깨끗하게 사용했고 상태 좋습니다. 직거래 선호해요.',
    author: '알뜰맘',
    authorImage: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    likeCount: 8,
    commentCount: 5,
    bookmarkCount: 2,
  },
  {
    id: 12,
    category: '장터',
    title: '이유식 용기 세트 나눔',
    content: '이유식 끝나서 용기 나눔해요. 실리콘 용기 10개 세트입니다. 선착순!',
    author: '나눔천사',
    authorImage: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
    likeCount: 25,
    commentCount: 42,
    bookmarkCount: 0,
  },
];

// 카테고리 목록
export const categories = ['전체', '일반', '고민', '장터'];

// 카테고리별 색상 (카드 후면 장식 레이어용)
export const categoryColors = {
  '전체': '#FFFFFF',
  '일반': '#EFC3C8',
  '고민': '#6F99F4',
  '장터': '#DDD6F3',
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
