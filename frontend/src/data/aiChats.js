export const AI_MODES = {
  mom: {
    id: 'mom',
    label: '맘 AI',
    cardBg: 'rgba(249, 183, 184, 0.53)',
    accent: '#FDA8A9',
    bubble: '#F8EAE7',
    send: '#FAB8B9',
  },
  doctor: {
    id: 'doctor',
    label: '닥터 AI',
    cardBg: 'rgba(77, 148, 204, 0.34)',
    accent: '#4D94CC',
    bubble: '#D5E9F0',
    send: '#4D94CC',
  },
  nutrition: {
    id: 'nutrition',
    label: '영양 AI',
    cardBg: 'rgba(156, 205, 100, 0.5)',
    accent: '#8DC849',
    bubble: '#DEEFCF',
    send: '#9DCE63',
  },
};

export const chatHistory = [
  {
    id: 1,
    mode: 'mom',
    title: '젖병 소독 주기 추천',
    dateLabel: '01.25 어제',
    relative: '어제',
    question: '젖병을 소독하려고 하는데, 젖병과 젖꼭지를 따로 할까? 소독하는 게 나을까?',
  },
  {
    id: 2,
    mode: 'nutrition',
    title: '이유식 재료 추천',
    dateLabel: '01.23 3일 전',
    relative: '3일 전',
    question: '멸치, 애호박, 두부로 이유식을 만들려는데 소고기, 닭고기 중 어떤 게 궁합이 좋아?',
  },
  {
    id: 3,
    mode: 'doctor',
    title: '숨쉬기 힘들어하는 증상 분석',
    dateLabel: '01.20 6일 전',
    relative: '6일 전',
    question: '밤마다 콧소리가 나고 기침을 하는데, 괜찮은 건지 걱정돼.',
  },
  {
    id: 4,
    mode: 'mom',
    title: '뒤집기 직후 기는 시점 예측',
    dateLabel: '01.05 3주 전',
    relative: '3주 전',
    question: '뒤집기만 성공했는데 언제쯤 기기 시작할까?',
  },
];

export const introMessages = {
  mom: [
    '육아하면서 혼자 고민하고 계신 게 있나요? 사소한 이야기라도 괜찮아요.',
    '육아 지식, 경험, 감정적 고립, 일상적인 판단까지 육아와 관련된 무엇이든 맘 AI에게 물어보세요!',
  ],
  doctor: [
    '아이 몸 상태가 평소와 달라 보여 걱정되시나요?',
    '증상, 변화, 궁금한 점을 말씀해 주시면 닥터 AI가 아이의 최근 상태를 파악하고 안내해드릴게요.',
  ],
  nutrition: [
    '아이 식사와 영양 때문에 고민되는 점이 있나요?',
    '균형 잡힌 식단과 간식, 수유와 이유식 준비까지 영양 AI가 아이의 최근 상태에 맞춰 함께 설계해드릴게요.',
  ],
};
