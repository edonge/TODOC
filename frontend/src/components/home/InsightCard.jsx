import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/base';
import todocAIIcon from '../../assets/icons/TodocAI.png';
import './InsightCard.css';

// 카테고리별 이모지 아이콘
const categoryIcons = {
  sleep: '😴',
  meal: '🍼',
  diaper: '🧷',
  health: '💊',
  growth: '📏',
  etc: '📝',
};

function InsightCard() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/users/me/insight', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInsight(data);
        }
      } catch (err) {
        console.error('인사이트 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  // 로딩 중
  if (loading) {
    return (
      <section className="insight-card">
        <div className="insight-header">
          <img src={todocAIIcon} alt="토닥 AI" className="insight-icon" />
          <span className="insight-title">
            <span className="highlight">토닥</span>이 기록을 분석하고 있어요...
          </span>
        </div>
        <div className="insight-content">
          <div className="insight-loading">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        </div>
      </section>
    );
  }

  // 인사이트가 없는 경우 (기록 없음)
  if (!insight) {
    return (
      <section className="insight-card">
        <div className="insight-header">
          <img src={todocAIIcon} alt="토닥 AI" className="insight-icon" />
          <span className="insight-title">
            <span className="highlight">토닥</span>이 최근 기록을 살펴봤어요
          </span>
        </div>
        <div className="insight-content">
          <p className="insight-text empty">
            아직 분석할 기록이 없어요.
          </p>
          <p className="insight-sub">
            기록을 남기면 토닥이가 맞춤 인사이트를 알려드릴게요!
          </p>
        </div>
      </section>
    );
  }

  const categoryIcon = categoryIcons[insight.category] || '📋';

  return (
    <section className="insight-card">
      <div className="insight-header">
        <img src={todocAIIcon} alt="토닥 AI" className="insight-icon" />
        <span className="insight-title">
          <span className="highlight">토닥</span>이 최근 기록을 살펴봤어요
        </span>
      </div>

      <div className="insight-content">
        <div className="insight-category-badge">
          <span className="category-icon">{categoryIcon}</span>
          <span className="category-label">{insight.category_label}</span>
        </div>
        <p className="insight-text">{insight.insight_text}</p>
      </div>
    </section>
  );
}

export default InsightCard;
