import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/base';
import DiaperCard from './DiaperCard';
import EtcCard from './EtcCard';
import SleepCard from './SleepCard';
import GrowthCard from './GrowthCard';
import MealCard from './MealCard';
import HealthCard from './HealthCard';
import './RecordCards.css';

// 식사 타입 매핑
const mealTypeLabels = {
  breast_milk: '모유',
  formula: '분유',
  bottle: '젖병',
  baby_food: '이유식',
  snack: '간식',
  other: '기타',
};

// 배변 타입 매핑
const diaperTypeLabels = {
  urine: '소변',
  stool: '대변',
  both: '대소변',
};

// 배변 상태 매핑
const conditionLabels = {
  normal: '정상',
  diarrhea: '설사',
  constipation: '변비',
};

// 수면 타입 매핑
const sleepTypeLabels = {
  night: '밤잠',
  nap: '낮잠',
};

// 시간 포맷팅 (datetime -> HH:MM)
const formatTime = (datetime) => {
  if (!datetime) return '';
  const d = new Date(datetime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 날짜 포맷팅 (YYYY-MM-DD -> MM.DD)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}.${parts[2]}`;
  }
  return dateStr;
};

// 수면 시간 계산 (duration_hours 사용 또는 직접 계산)
const formatDuration = (durationHours) => {
  if (!durationHours) return '0h';
  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours - hours) * 60);
  if (minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${hours}h`;
};

// 상대 시간 계산
const getRelativeTime = (datetime) => {
  if (!datetime) return '';
  const now = new Date();
  const target = new Date(datetime);
  const diffMs = now - target;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${diffDays}일 전`;
};

const asDateTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.length === 10 && value.includes('-')) {
    return `${value}T00:00:00`;
  }
  return value;
};

const isSameDate = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  return dateA === dateB;
};

const toDateString = (date) => date.toISOString().split('T')[0];

function RecordCards({ selectedDate, kidId, refreshKey }) {
  const [records, setRecords] = useState([]);
  const [growthHistory, setGrowthHistory] = useState([]);
  const [previousRecords, setPreviousRecords] = useState({
    growth: null,
    health: null,
    diaper: null,
    etc: null,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 기록 데이터 가져오기
  const fetchRecords = useCallback(async () => {
    if (!kidId || !selectedDate) {
      setRecords([]);
      setGrowthHistory([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const [dailyResponse, growthResponse, prevGrowth, prevHealth, prevDiaper, prevEtc] = await Promise.all([
        apiFetch(`/api/kids/${kidId}/records/date/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/api/kids/${kidId}/records?record_type=growth&limit=2&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/api/kids/${kidId}/records?record_type=growth&end_date=${selectedDate}&limit=1&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/api/kids/${kidId}/records?record_type=health&end_date=${selectedDate}&limit=1&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/api/kids/${kidId}/records?record_type=diaper&end_date=${selectedDate}&limit=1&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/api/kids/${kidId}/records?record_type=etc&end_date=${selectedDate}&limit=1&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dailyResponse.ok) {
        const data = await dailyResponse.json();
        setRecords(data.records || []);
      }

      if (growthResponse.ok) {
        const data = await growthResponse.json();
        setGrowthHistory(data.records || []);
      }
      const nextPrevious = { growth: null, health: null, diaper: null, etc: null };
      if (prevGrowth.ok) {
        const data = await prevGrowth.json();
        nextPrevious.growth = data.records?.[0] || null;
      }
      if (prevHealth.ok) {
        const data = await prevHealth.json();
        nextPrevious.health = data.records?.[0] || null;
      }
      if (prevDiaper.ok) {
        const data = await prevDiaper.json();
        nextPrevious.diaper = data.records?.[0] || null;
      }
      if (prevEtc.ok) {
        const data = await prevEtc.json();
        nextPrevious.etc = data.records?.[0] || null;
      }
      setPreviousRecords(nextPrevious);
    } catch (error) {
      console.error('기록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [kidId, selectedDate, refreshKey]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 기록을 타입별로 분류
  const categorizeRecords = () => {
    const categorized = {
      sleep: [],
      growth: [],
      meal: [],
      health: [],
      diaper: [],
      etc: [],
    };

    records.forEach((record) => {
      switch (record.record_type) {
        case 'sleep':
          categorized.sleep.push(record);
          break;
        case 'growth':
          categorized.growth.push(record);
          break;
        case 'meal':
          categorized.meal.push(record);
          break;
        case 'health':
          categorized.health.push(record);
          break;
        case 'diaper':
          categorized.diaper.push(record);
          break;
        case 'etc':
          categorized.etc.push(record);
          break;
        default:
          break;
      }
    });

    return categorized;
  };

  // 수면 카드용 데이터 변환
  const transformSleepData = (sleepRecords) => {
    if (!sleepRecords || sleepRecords.length === 0) return [];

    return sleepRecords.map((record) => ({
      id: record.id,
      type: sleepTypeLabels[record.sleep_type] || record.sleep_type,
      start: formatTime(record.start_datetime),
      end: formatTime(record.end_datetime),
      duration: formatDuration(record.duration_hours),
      color: record.sleep_type === 'night' ? '#328B6D' : '#E8D5A3',
      raw: record,
    }));
  };

  // 성장 카드용 데이터 변환
  const buildGrowthData = (latest, previous) => {
    if (!latest) return null;

    // 활동 목록 변환
    const activityLabels = {
      reading: '독서',
      walking: '산책',
      bathing: '목욕',
      playing: '놀이',
      music: '음악',
      exercise: '체조',
      swimming: '수영',
    };

    const formatDelta = (current, prev) => {
      if (current == null || prev == null) return null;
      const diff = parseFloat(current) - parseFloat(prev);
      const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
      return `${sign}${Math.abs(diff).toFixed(1)}`;
    };

    return {
      recordId: latest.id,
      raw: latest,
      lastRecord: getRelativeTime(asDateTime(latest.record_date || latest.created_at)),
      height: latest.height_cm != null
        ? {
            value: parseFloat(latest.height_cm),
            change: formatDelta(latest.height_cm, previous?.height_cm),
          }
        : null,
      weight: latest.weight_kg != null
        ? {
            value: parseFloat(latest.weight_kg),
            change: formatDelta(latest.weight_kg, previous?.weight_kg),
          }
        : null,
      headCircumference: latest.head_circumference_cm != null
        ? {
            value: parseFloat(latest.head_circumference_cm),
            change: formatDelta(latest.head_circumference_cm, previous?.head_circumference_cm),
          }
        : null,
      activities: (latest.activities || []).map((a) => activityLabels[a] || a),
    };
  };

  const transformGrowthData = (growthRecords) => {
    if (!growthRecords || growthRecords.length === 0) return null;

    const sortedRecords = [...growthRecords].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const latest = sortedRecords[0];
    const previous = sortedRecords[1];

    return buildGrowthData(latest, previous);
  };

  // 식사 카드용 데이터 변환
  const transformMealData = (mealRecords) => {
    if (!mealRecords || mealRecords.length === 0) return [];

    return mealRecords
      .sort((a, b) => new Date(b.meal_datetime) - new Date(a.meal_datetime))
      .map((record) => {
        let amount = '';
        if (record.amount_ml) {
          amount = `${record.amount_ml}ml`;
        } else if (record.duration_minutes) {
          amount = `${record.duration_minutes}분`;
        } else if (record.amount_text) {
          amount = record.amount_text;
        }

        return {
          id: record.id,
          time: formatTime(record.meal_datetime),
          type: mealTypeLabels[record.meal_type] || record.meal_type,
          amount,
          burp: record.burp ? '트림 O' : '트림 X',
          raw: record,
        };
      });
  };

  // 건강 카드용 데이터 변환
  const transformHealthData = (healthRecords) => {
    if (!healthRecords || healthRecords.length === 0) return null;

    const sortedRecords = [...healthRecords].sort(
      (a, b) => new Date(b.health_datetime) - new Date(a.health_datetime)
    );

    const symptomLabels = {
      fever: '열',
      runny_nose: '콧물',
      cough: '기침',
      vomit: '구토',
      diarrhea: '설사',
      rash: '발진',
      headache: '두통',
    };

    const medicineLabels = {
      antipyretic: '해열제',
      painkiller: '진통제',
      cold_medicine: '감기약',
      antibiotic: '항생제',
      ointment: '연고',
      eye_drops: '안약',
    };

    return {
      lastRecord: getRelativeTime(sortedRecords[0].health_datetime),
      records: sortedRecords.map((record) => {
        const tags = [
          ...(record.symptoms || []).map((s) => symptomLabels[s] || s),
          ...(record.medicines || []).map((m) => medicineLabels[m] || m),
        ];

        return {
          id: record.id,
          title: record.title || record.memo || '건강 기록',
          date: formatDate(record.record_date),
          tags,
          raw: record,
        };
      }),
    };
  };

  // 배변 카드용 데이터 변환
  const transformDiaperData = (diaperRecords) => {
    if (!diaperRecords || diaperRecords.length === 0) return null;

    const sortedRecords = [...diaperRecords].sort(
      (a, b) => new Date(b.diaper_datetime) - new Date(a.diaper_datetime)
    );

    return {
      lastRecord: getRelativeTime(sortedRecords[0].diaper_datetime),
      records: sortedRecords.map((record) => ({
        id: record.id,
        time: formatTime(record.diaper_datetime),
        type: diaperTypeLabels[record.diaper_type] || record.diaper_type,
        condition: conditionLabels[record.condition] || record.condition || '정상',
        color: record.diaper_type === 'urine' ? '#E8D5A3' : '#4B3131',
        raw: record,
      })),
    };
  };

  // 기타 카드용 데이터 변환
  const transformEtcData = (etcRecords) => {
    if (!etcRecords || etcRecords.length === 0) return null;

    const sortedRecords = [...etcRecords].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return {
      lastRecord: getRelativeTime(asDateTime(sortedRecords[0].record_date || sortedRecords[0].created_at)),
      records: sortedRecords.map((record) => ({
        id: record.id,
        date: formatDate(record.record_date),
        text: record.title || record.memo || '',
        raw: record,
      })),
    };
  };

  const categorized = categorizeRecords();

  const sleepData = transformSleepData(categorized.sleep);
  const growthSource = growthHistory.length > 0 ? growthHistory : categorized.growth;
  let growthData = transformGrowthData(growthSource);
  const dailyGrowthRecord = categorized.growth.length > 0
    ? [...categorized.growth].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;
  if (!dailyGrowthRecord) {
    growthData = null;
  } else {
    let previousRecord = null;
    if (growthHistory.length > 0 && growthHistory[0]?.id === dailyGrowthRecord.id) {
      previousRecord = growthHistory[1] || null;
    }
    if (!growthData || growthData.raw?.id !== dailyGrowthRecord.id) {
      growthData = buildGrowthData(dailyGrowthRecord, previousRecord);
    }
    if (growthData) {
      growthData.editRecord = dailyGrowthRecord;
    }
  }
  const mealData = transformMealData(categorized.meal);
  const healthData = transformHealthData(categorized.health);
  const diaperData = transformDiaperData(categorized.diaper);
  const etcData = transformEtcData(categorized.etc);

  const today = toDateString(new Date());
  const isToday = isSameDate(selectedDate, today);

  const buildHeader = (label, hasRecords, lastRecord, previousDate) => {
    if (isToday) {
      return {
        title: `최근 ${label} 기록`,
        sub: hasRecords
          ? `마지막 기록 : ${lastRecord || '-'}`
          : previousDate
            ? `이전 마지막 기록 : ${formatDate(previousDate)}`
            : '이전 마지막 기록 없음',
      };
    }
    return {
      title: `${label} 기록`,
      sub: hasRecords
        ? `${formatDate(selectedDate)} 기록`
        : previousDate
          ? `이전 마지막 기록 : ${formatDate(previousDate)}`
          : '이전 마지막 기록 없음',
    };
  };

  const growthHeader = buildHeader(
    '성장',
    categorized.growth.length > 0,
    growthData?.lastRecord,
    previousRecords.growth?.record_date
  );
  const healthHeader = buildHeader(
    '건강',
    categorized.health.length > 0,
    healthData?.lastRecord,
    previousRecords.health?.record_date
  );
  const diaperHeader = buildHeader(
    '배변',
    categorized.diaper.length > 0,
    diaperData?.lastRecord,
    previousRecords.diaper?.record_date
  );
  const etcHeader = buildHeader(
    '기타',
    categorized.etc.length > 0,
    etcData?.lastRecord,
    previousRecords.etc?.record_date
  );

  if (loading) {
    return (
      <div className="record-cards-container">
        <div className="loading-message">기록을 불러오는 중...</div>
      </div>
    );
  }

  const handleEditRecord = (record) => {
    if (!record) return;
    const recordType = record.record_type?.value || record.record_type;
    const dateParam = record.record_date ? `?date=${record.record_date}` : '';
    switch (recordType) {
      case 'sleep':
        navigate(`/record/sleep/add${dateParam}`, { state: { record } });
        break;
      case 'growth':
        navigate(`/record/growth/add${dateParam}`, { state: { record } });
        break;
      case 'meal':
        navigate(`/record/meal/add${dateParam}`, { state: { record } });
        break;
      case 'health':
        navigate(`/record/health/add${dateParam}`, { state: { record } });
        break;
      case 'diaper':
        navigate(`/record/diaper/add${dateParam}`, { state: { record } });
        break;
      case 'etc':
        navigate(`/record/etc/add${dateParam}`, { state: { record } });
        break;
      default:
        break;
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!record || !kidId) return;
    const confirmed = window.confirm('기록을 삭제할까요?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await apiFetch(`/api/kids/${kidId}/records/${record.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.detail || '기록 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('기록 삭제 실패:', error);
      alert('기록 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="record-cards-container">
      {/* 수면 카드 - 항상 표시 */}
      <SleepCard
        records={sleepData}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />

      {/* 성장 카드 - 항상 표시 */}
      <GrowthCard
        data={growthData}
        headerTitle={growthHeader.title}
        headerSub={growthHeader.sub}
        emptyLines={[
          '해당 날짜에 성장 기록이 없어요.',
          '키, 몸무게, 머리둘레를 기록해 보세요.',
        ]}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />

      {/* 식사 카드 - 항상 표시 */}
      <MealCard
        records={mealData}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />

      {/* 건강 카드 - 항상 표시 */}
      <HealthCard
        data={healthData}
        headerTitle={healthHeader.title}
        headerSub={healthHeader.sub}
        emptyLines={[
          '해당 날짜에 건강 기록이 없어요.',
          '아이 컨디션이 변하면 가볍게 메모해두세요.',
        ]}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />

      {/* 배변 카드 - 항상 표시 */}
      <DiaperCard
        data={diaperData}
        headerTitle={diaperHeader.title}
        headerSub={diaperHeader.sub}
        emptyLines={[
          '해당 날짜에 배변 기록이 없어요.',
          '기저귀 교체 시 기록해 두면',
          '패턴을 파악하는 데 도움이 돼요.',
        ]}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />

      {/* 기타 카드 - 항상 표시 */}
      <EtcCard
        data={etcData}
        headerTitle={etcHeader.title}
        headerSub={etcHeader.sub}
        emptyLines={[
          '해당 날짜에 기록이 없어요.',
          '특별한 순간이나 메모를',
          '자유롭게 기록해 보세요.',
        ]}
        onEdit={(record) => handleEditRecord(record)}
        onDelete={(record) => handleDeleteRecord(record)}
      />
    </div>
  );
}

export default RecordCards;
