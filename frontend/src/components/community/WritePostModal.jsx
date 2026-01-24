import { useEffect, useState } from 'react';
import { categoryColors } from '../../data/communityData';
import './WritePostModal.css';

function WritePostModal({
  onClose,
  onSubmit,
  categories,
  initialCategory,
  initialTitle = '',
  initialContent = '',
  headerTitle = '글 작성하기',
  submitLabel = '글 추가하기',
}) {
  const [category, setCategory] = useState(initialCategory || categories[0]);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    setCategory(initialCategory || categories[0]);
    setTitle(initialTitle || '');
    setContent(initialContent || '');
  }, [initialCategory, initialTitle, initialContent, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    onSubmit({ category, title, content });
  };

  return (
    <div className="write-modal-overlay" onClick={onClose}>
      <div className="write-modal" onClick={(e) => e.stopPropagation()}>
        <div className="write-modal-header">
          <h2 className="write-modal-title">{headerTitle}</h2>
          <button className="write-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <form className="write-modal-form" onSubmit={handleSubmit}>
          <div className="write-modal-fields">
            <div className="write-form-group">
              <label className="write-form-label">카테고리</label>
              <div className="write-category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`write-category-tab ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                    style={category === cat ? { backgroundColor: categoryColors[cat] } : undefined}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="write-form-group">
              <label className="write-form-label">제목</label>
              <input
                type="text"
                className="write-form-input"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                type="button"
                className="write-image-btn"
                onClick={() => alert('추후 구현 예정입니다.')}
              >
                이미지 삽입
              </button>
            </div>

            <div className="write-form-group">
              <label className="write-form-label">내용</label>
              <textarea
                className="write-form-textarea"
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <button type="submit" className="write-submit-btn write-submit-below">
              {submitLabel}
            </button>
            <div className="write-modal-spacer"></div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WritePostModal;
