import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/base';
import './VoiceResultModal.css';

const RECORD_TYPE_LABELS = {
  sleep: '수면',
  growth: '성장',
  meal: '식사',
  health: '건강',
  diaper: '배변',
  etc: '기타',
};

const RECORD_TYPE_COLORS = {
  sleep: { bg: '#F5E6C8', color: '#8B6914' },
  growth: { bg: '#C8E6C9', color: '#2E7D32' },
  meal: { bg: '#FFF8E1', color: '#F9A825' },
  health: { bg: '#FFCDD2', color: '#8B1A1A' },
  diaper: { bg: '#FCE4EC', color: '#AD1457' },
  etc: { bg: '#F1F1F1', color: '#5C5C5C' },
};

const FIELD_LABELS = {
  // Meal
  meal_datetime: '식사 시간',
  meal_type: '식사 유형',
  meal_detail: '상세',
  amount_ml: '양(ml)',
  amount_text: '양',
  duration_minutes: '시간(분)',
  burp: '트림',
  // Sleep
  sleep_type: '수면 유형',
  start_datetime: '시작',
  end_datetime: '종료',
  sleep_quality: '수면 품질',
  // Diaper
  diaper_datetime: '배변 시간',
  diaper_type: '배변 유형',
  amount: '양',
  condition: '상태',
  color: '색깔',
  // Growth
  height_cm: '키(cm)',
  weight_kg: '몸무게(kg)',
  head_circumference_cm: '머리둘레(cm)',
  activities: '활동',
  // Health
  health_datetime: '시간',
  title: '제목',
  symptoms: '증상',
  medicines: '투약',
  // Common
  record_date: '날짜',
  memo: '메모',
};

const ENUM_LABELS = {
  breast_milk: '모유', formula: '분유', bottle: '젖병',
  baby_food: '이유식', snack: '간식', other: '기타',
  nap: '낮잠', night: '밤잠',
  good: '좋음', normal: '보통', bad: '나쁨',
  urine: '소변', stool: '대변', both: '둘다',
  much: '많음', little: '적음',
  diarrhea: '설사', constipation: '변비',
  yellow: '노랑', brown: '갈색', green: '초록',
  fever: '열', runny_nose: '콧물', cough: '기침',
  vomit: '구토', rash: '발진', headache: '두통',
  antipyretic: '해열제', painkiller: '진통제',
  cold_medicine: '감기약', antibiotic: '항생제',
  ointment: '연고', eye_drops: '안약',
  reading: '독서', walking: '산책', bathing: '목욕',
  playing: '놀이', music: '음악', exercise: '체조', swimming: '수영',
};

function formatValue(key, value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (Array.isArray(value)) {
    return value.map(v => ENUM_LABELS[v] || v).join(', ');
  }
  if (typeof value === 'string' && value.includes('T')) {
    // Datetime format
    const parts = value.split('T');
    if (parts.length === 2) return parts[1].substring(0, 5);
  }
  return ENUM_LABELS[value] || value;
}

// Fields to show per record type (excluding internal fields)
const DISPLAY_FIELDS = {
  meal: ['record_date', 'meal_datetime', 'meal_type', 'amount_ml', 'amount_text', 'meal_detail', 'duration_minutes', 'burp', 'memo'],
  sleep: ['record_date', 'sleep_type', 'start_datetime', 'end_datetime', 'sleep_quality', 'memo'],
  diaper: ['record_date', 'diaper_datetime', 'diaper_type', 'amount', 'condition', 'color', 'memo'],
  growth: ['record_date', 'height_cm', 'weight_kg', 'head_circumference_cm', 'activities', 'memo'],
  health: ['record_date', 'health_datetime', 'title', 'symptoms', 'medicines', 'memo'],
  etc: ['record_date', 'title', 'memo'],
};

function VoiceResultModal({ data, kidId, onSaved, onClose }) {
  const { transcript, records } = data;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const current = records[currentIndex];
  const record_type = current.record_type;
  const record_data = current.record_data;
  const isLast = currentIndex >= records.length - 1;
  const totalCount = records.length;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');

      const body = { ...record_data };
      delete body.record_type;

      const response = await apiFetch(`/api/kids/${kidId}/records/${record_type}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '기록 저장에 실패했습니다.');
      }

      const newSavedCount = savedCount + 1;
      setSavedCount(newSavedCount);

      if (isLast) {
        onSaved();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      console.error('Record save failed:', err);
      alert(err.message || '기록 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      if (savedCount > 0) {
        onSaved();
      } else {
        onClose();
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const fields = DISPLAY_FIELDS[record_type] || DISPLAY_FIELDS.etc;

  return (
    <div className="voice-result-overlay" onClick={onClose}>
      <div className="voice-result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-result-header">
          <span
            className="voice-result-type-badge"
            style={{
              backgroundColor: (RECORD_TYPE_COLORS[record_type] || RECORD_TYPE_COLORS.etc).bg,
              color: (RECORD_TYPE_COLORS[record_type] || RECORD_TYPE_COLORS.etc).color,
            }}
          >
            {RECORD_TYPE_LABELS[record_type] || '기타'}
          </span>
          <h3 className="voice-result-title">
            음성 기록 확인{totalCount > 1 ? ` (${currentIndex + 1}/${totalCount})` : ''}
          </h3>
        </div>

        <div className="voice-result-transcript">
          <p className="voice-result-transcript-label">인식된 텍스트</p>
          <p className="voice-result-transcript-text">"{transcript}"</p>
        </div>

        <div className="voice-result-fields">
          {fields.map((key) => {
            // unknown_time이면 시간 필드 숨기기
            if (record_data.unknown_time && ['meal_datetime', 'diaper_datetime', 'health_datetime'].includes(key)) {
              return null;
            }
            const val = formatValue(key, record_data[key]);
            if (val === null) return null;
            return (
              <div className="voice-result-field" key={key}>
                <span className="voice-result-field-label">
                  {FIELD_LABELS[key] || key}
                </span>
                <span className="voice-result-field-value">{val}</span>
              </div>
            );
          })}
        </div>

        <div className="voice-result-actions">
          <button
            className="voice-result-btn voice-result-btn--cancel"
            onClick={handleSkip}
            disabled={saving}
          >
            {totalCount > 1 && !isLast ? '건너뛰기' : '취소'}
          </button>
          <button
            className="voice-result-btn voice-result-btn--save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : isLast ? '저장' : '저장 후 다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceResultModal;
