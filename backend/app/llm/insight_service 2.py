"""
인사이트 생성 서비스
- 최근 7일 기록 분석
- 특이사항 감지
- LLM 기반 인사이트 문장 생성
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
import random

from sqlalchemy.orm import Session, joinedload
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.models import (
    Record, Kid, UserInsight,
    SleepRecord, MealRecord, DiaperRecord, HealthRecord, GrowthRecord, EtcRecord,
    RecordTypeEnum, StoolConditionEnum,
)


# 카테고리 레이블 매핑
CATEGORY_LABELS = {
    "sleep": "수면",
    "meal": "식사",
    "diaper": "배변",
    "health": "건강",
    "growth": "성장",
    "etc": "기타",
}

# 한국 성씨 목록
KOREAN_SURNAMES = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
    '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남',
    '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민',
    '나', '진', '지', '엄', '채', '원', '천', '방', '공', '현',
]


def get_friendly_name(full_name: str) -> str:
    """
    이름을 친근한 호칭으로 변환
    - 김태우 → 태우
    - 이현동 → 현동이
    - 태우 → 태우
    - 힘찬이 → 힘찬이
    """
    if not full_name:
        return "아이"

    # 3글자 이상이고 첫 글자가 성씨인 경우 → 성 제외
    if len(full_name) >= 3 and full_name[0] in KOREAN_SURNAMES:
        name_only = full_name[1:]
    else:
        name_only = full_name

    # 마지막 글자 받침 확인하여 "이" 추가
    last_char = name_only[-1]
    code = ord(last_char) - 0xAC00

    # 한글이 아닌 경우
    if code < 0 or code > 11171:
        return name_only

    # 받침 유무 확인 (받침 있으면 "이" 추가)
    has_batchim = code % 28 != 0
    return f"{name_only}이" if has_batchim else name_only


class RecordAnalyzer:
    """최근 기록 분석 및 특이사항 감지"""

    def __init__(self, db: Session, kid_id: int, days: int = 7):
        self.db = db
        self.kid_id = kid_id
        self.days = days
        self.since = datetime.utcnow() - timedelta(days=days)

    def get_records_by_type(self, record_type: RecordTypeEnum) -> List[Record]:
        """타입별 기록 조회"""
        return (
            self.db.query(Record)
            .options(
                joinedload(Record.sleep_record),
                joinedload(Record.meal_record),
                joinedload(Record.diaper_record),
                joinedload(Record.health_record),
                joinedload(Record.growth_record),
                joinedload(Record.etc_record),
            )
            .filter(
                Record.kid_id == self.kid_id,
                Record.record_type == record_type,
                Record.created_at >= self.since,
            )
            .order_by(Record.created_at.desc())
            .all()
        )

    def analyze_sleep(self) -> Dict[str, Any]:
        """수면 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.SLEEP)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        total_hours = 0
        nap_count = 0
        night_count = 0
        record_dates = set()  # 기록이 있는 날짜들

        for r in records:
            sr = r.sleep_record
            if sr:
                total_hours += sr.duration_hours
                record_dates.add(r.record_date)
                if sr.sleep_type.value == "nap":
                    nap_count += 1
                else:
                    night_count += 1

        # 기록이 있는 날 수로 평균 계산
        days_with_records = len(record_dates) if record_dates else 1
        avg_daily = total_hours / days_with_records
        anomaly = None

        # 특이사항 감지
        if nap_count == 0 and night_count > 0:
            anomaly = "no_nap"
        elif avg_daily < 10:  # 일평균 10시간 미만
            anomaly = "low_sleep"
        elif avg_daily > 16:  # 일평균 16시간 초과
            anomaly = "high_sleep"

        return {
            "count": len(records),
            "anomaly": anomaly,
            "data": {
                "total_hours": round(total_hours, 1),
                "avg_daily": round(avg_daily, 1),
                "days_with_records": days_with_records,
                "nap_count": nap_count,
                "night_count": night_count,
            }
        }

    def analyze_meal(self) -> Dict[str, Any]:
        """식사 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.MEAL)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        total_ml = 0
        meal_count = 0
        type_counts = {}
        record_dates = set()  # 기록이 있는 날짜들

        for r in records:
            mr = r.meal_record
            if mr:
                meal_count += 1
                record_dates.add(r.record_date)
                if mr.amount_ml:
                    total_ml += mr.amount_ml
                meal_type = mr.meal_type.value
                type_counts[meal_type] = type_counts.get(meal_type, 0) + 1

        # 기록이 있는 날 수로 평균 계산
        days_with_records = len(record_dates) if record_dates else 1
        avg_daily_count = meal_count / days_with_records
        anomaly = None

        # 특이사항 감지 (기록 있는 날 기준)
        if avg_daily_count < 4:  # 일평균 4회 미만
            anomaly = "low_meal_count"
        elif total_ml > 0 and (total_ml / meal_count) < 80:  # 평균 80ml 미만
            anomaly = "low_amount"

        return {
            "count": len(records),
            "anomaly": anomaly,
            "data": {
                "total_ml": total_ml,
                "meal_count": meal_count,
                "days_with_records": days_with_records,
                "avg_daily_count": round(avg_daily_count, 1),
                "type_counts": type_counts,
            }
        }

    def analyze_diaper(self) -> Dict[str, Any]:
        """배변 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.DIAPER)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        stool_count = 0
        urine_count = 0
        diarrhea_count = 0
        constipation_days = 0
        last_stool_date = None

        for r in records:
            dr = r.diaper_record
            if dr:
                dtype = dr.diaper_type.value
                if dtype in ("stool", "both"):
                    stool_count += 1
                    if last_stool_date is None or r.record_date > last_stool_date:
                        last_stool_date = r.record_date
                    if dr.condition == StoolConditionEnum.DIARRHEA:
                        diarrhea_count += 1
                if dtype in ("urine", "both"):
                    urine_count += 1

        anomaly = None

        # 특이사항 감지
        if stool_count == 0:
            anomaly = "no_stool"
        elif diarrhea_count >= 3:
            anomaly = "frequent_diarrhea"
        elif stool_count < 3 and self.days >= 7:  # 7일간 대변 3회 미만
            anomaly = "low_stool"

        return {
            "count": len(records),
            "anomaly": anomaly,
            "data": {
                "stool_count": stool_count,
                "urine_count": urine_count,
                "diarrhea_count": diarrhea_count,
            }
        }

    def analyze_health(self) -> Dict[str, Any]:
        """건강 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.HEALTH)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        all_symptoms = []
        all_medicines = []

        for r in records:
            hr = r.health_record
            if hr:
                if hr.symptoms:
                    all_symptoms.extend([s.value for s in hr.symptoms])
                if hr.medicines:
                    all_medicines.extend([m.value for m in hr.medicines])

        anomaly = None

        # 특이사항 감지: 건강 기록이 있으면 특이사항으로 간주
        if len(records) > 0:
            if "fever" in all_symptoms:
                anomaly = "fever_detected"
            elif len(all_symptoms) > 0:
                anomaly = "symptoms_detected"

        return {
            "count": len(records),
            "anomaly": anomaly,
            "data": {
                "symptoms": list(set(all_symptoms)),
                "medicines": list(set(all_medicines)),
            }
        }

    def analyze_growth(self) -> Dict[str, Any]:
        """성장 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.GROWTH)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        latest = records[0].growth_record if records else None
        anomaly = None

        data = {}
        if latest:
            if latest.height_cm:
                data["height_cm"] = float(latest.height_cm)
            if latest.weight_kg:
                data["weight_kg"] = float(latest.weight_kg)
            if latest.activities:
                data["activities"] = [a.value for a in latest.activities]

        return {
            "count": len(records),
            "anomaly": anomaly,
            "data": data if data else None,
        }

    def analyze_etc(self) -> Dict[str, Any]:
        """기타 기록 분석"""
        records = self.get_records_by_type(RecordTypeEnum.ETC)
        if not records:
            return {"count": 0, "anomaly": None, "data": None}

        titles = [r.etc_record.title for r in records if r.etc_record]

        return {
            "count": len(records),
            "anomaly": None,
            "data": {"titles": titles[:5]},  # 최근 5개만
        }

    def analyze_all(self) -> Dict[str, Dict[str, Any]]:
        """모든 카테고리 분석"""
        return {
            "sleep": self.analyze_sleep(),
            "meal": self.analyze_meal(),
            "diaper": self.analyze_diaper(),
            "health": self.analyze_health(),
            "growth": self.analyze_growth(),
            "etc": self.analyze_etc(),
        }

    def select_category(self) -> Optional[str]:
        """
        인사이트 생성할 카테고리 선택
        1. 특이사항 있는 카테고리 우선
        2. 없으면 데이터 많은 카테고리
        """
        analysis = self.analyze_all()

        # 1. 특이사항 있는 카테고리 필터
        anomaly_categories = [
            cat for cat, data in analysis.items()
            if data["anomaly"] is not None
        ]

        if anomaly_categories:
            return random.choice(anomaly_categories)

        # 2. 데이터 있는 카테고리 중 가장 많은 것
        categories_with_data = [
            (cat, data["count"]) for cat, data in analysis.items()
            if data["count"] > 0
        ]

        if not categories_with_data:
            return None

        categories_with_data.sort(key=lambda x: x[1], reverse=True)
        return categories_with_data[0][0]


class InsightGenerator:
    """LLM 기반 인사이트 생성"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )

    async def generate(
        self,
        category: str,
        analysis_data: Dict[str, Any],
        kid_name: str,
    ) -> str:
        """인사이트 문장 생성"""
        category_label = CATEGORY_LABELS.get(category, category)
        anomaly = analysis_data.get("anomaly")
        data = analysis_data.get("data", {})

        # 친근한 이름으로 변환 (김태우 → 태우, 이현동 → 현동이)
        friendly_name = get_friendly_name(kid_name)

        # 기록 있는 날 수 정보
        days_with_records = data.get("days_with_records", 0)

        prompt = f"""당신은 육아 전문가입니다. 아이의 최근 기록을 분석하여
부모에게 도움이 될 인사이트를 1-2문장으로 작성해주세요.

아이 호칭: {friendly_name}
카테고리: {category_label}
기록이 있는 날 수: {days_with_records}일
분석 데이터: {data}
특이사항: {anomaly or "없음"}

작성 시 유의사항:
- 따뜻하고 친근한 톤으로 작성
- 아이를 부를 때 반드시 "{friendly_name}"로 호칭 (예: "{friendly_name}가", "{friendly_name}는")
- 평균은 "기록이 있는 날" 기준임을 인지 (7일 전체가 아님)
- 구체적인 수치가 있다면 자연스럽게 언급
- 특이사항이 있다면 부드럽게 조언
- 특이사항이 없다면 칭찬이나 격려
- 1-2문장으로 간결하게

인사이트:"""

        response = await self.llm.ainvoke(prompt)
        return response.content.strip()


async def get_or_create_insight(
    db: Session,
    user_id: int,
    kid: Kid,
) -> Optional[UserInsight]:
    """
    인사이트 조회 또는 생성
    - 12시간 이내 캐시가 있으면 반환
    - 없으면 새로 생성
    """
    # 1. 캐시 확인 (12시간 이내)
    cache_threshold = datetime.utcnow() - timedelta(hours=12)
    cached = (
        db.query(UserInsight)
        .filter(
            UserInsight.user_id == user_id,
            UserInsight.kid_id == kid.id,
            UserInsight.generated_at >= cache_threshold,
        )
        .order_by(UserInsight.generated_at.desc())
        .first()
    )

    if cached:
        return cached

    # 2. 새로 생성
    analyzer = RecordAnalyzer(db, kid.id)
    category = analyzer.select_category()

    if not category:
        # 기록이 없는 경우
        return None

    analysis = analyzer.analyze_all()
    category_data = analysis[category]

    generator = InsightGenerator()
    insight_text = await generator.generate(
        category=category,
        analysis_data=category_data,
        kid_name=kid.name,
    )

    # 3. DB 저장
    new_insight = UserInsight(
        user_id=user_id,
        kid_id=kid.id,
        category=category,
        insight_text=insight_text,
    )
    db.add(new_insight)
    db.commit()
    db.refresh(new_insight)

    return new_insight
