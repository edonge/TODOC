import { useEffect } from 'react';
import './RecordCategoryModal.css';

// 카테고리 이미지 import
import sleepImg from '../../assets/categories/수면.png';
import growthImg from '../../assets/categories/성장.png';
import mealImg from '../../assets/categories/식사.png';
import healthImg from '../../assets/categories/건강.png';
import diaperImg from '../../assets/categories/배변.png';
import etcImg from '../../assets/categories/기타.png';

function RecordCategoryModal({ onClose, onSelectCategory }) {
  // 스크롤 방지
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const categories = [
    { id: 'sleep', name: '수면', image: sleepImg },
    { id: 'growth', name: '성장', image: growthImg },
    { id: 'meal', name: '식사', image: mealImg },
    { id: 'health', name: '건강', image: healthImg },
    { id: 'diaper', name: '배변', image: diaperImg },
    { id: 'etc', name: '기타', image: etcImg },
  ];

  const handleCategoryClick = (category) => {
    onSelectCategory(category);
  };

  return (
    <div className="record-modal-overlay" onClick={onClose}>
      <div className="record-modal" onClick={(e) => e.stopPropagation()}>
        <div className="record-modal-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className="record-modal-item"
              onClick={() => handleCategoryClick(category)}
            >
              <img
                src={category.image}
                alt={category.name}
                className="record-modal-img"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecordCategoryModal;
