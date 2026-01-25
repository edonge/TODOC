from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

from app.models.enums import (
    RecordTypeEnum,
    SleepTypeEnum,
    SleepQualityEnum,
    MealTypeEnum,
    SymptomEnum,
    MedicineEnum,
    DiaperTypeEnum,
    StoolAmountEnum,
    StoolConditionEnum,
    StoolColorEnum,
    ActivityEnum,
)


# =============================================================================
# Base Record (공통 기록 베이스)
# =============================================================================
class RecordBase(BaseModel):
    """모든 기록의 기본 필드"""
    record_date: date = Field(..., description="기록 날짜")
    memo: Optional[str] = Field(None, description="메모")
    image_url: Optional[str] = Field(None, description="이미지 URL")


class RecordCreate(RecordBase):
    """기록 생성 시 필요한 필드"""
    record_type: RecordTypeEnum


class RecordResponse(RecordBase):
    """기록 응답"""
    id: int
    kid_id: int
    record_type: RecordTypeEnum
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =============================================================================
# Sleep Record (수면 기록)
# =============================================================================
class SleepRecordBase(BaseModel):
    """수면 기록 기본 필드"""
    sleep_type: SleepTypeEnum = Field(..., description="수면 종류 (낮잠/밤잠)")
    start_datetime: datetime = Field(..., description="시작 시간")
    end_datetime: datetime = Field(..., description="종료 시간")
    sleep_quality: Optional[SleepQualityEnum] = Field(None, description="수면 품질")


class SleepRecordCreate(RecordBase, SleepRecordBase):
    """수면 기록 생성"""
    pass


class SleepRecordUpdate(RecordBase):
    """수면 기록 수정"""
    sleep_type: Optional[SleepTypeEnum] = Field(None, description="수면 종류 (낮잠/밤잠)")
    start_datetime: Optional[datetime] = Field(None, description="시작 시간")
    end_datetime: Optional[datetime] = Field(None, description="종료 시간")
    sleep_quality: Optional[SleepQualityEnum] = Field(None, description="수면 품질")


class SleepRecordResponse(BaseModel):
    """수면 기록 응답"""
    id: int
    sleep_type: SleepTypeEnum
    start_datetime: datetime
    end_datetime: datetime
    sleep_quality: Optional[SleepQualityEnum]
    duration_hours: Optional[float] = Field(None, description="수면 시간 (계산값)")
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Growth Record (성장 기록)
# =============================================================================
class GrowthRecordBase(BaseModel):
    """성장 기록 기본 필드"""
    height_cm: Optional[Decimal] = Field(
        None,
        ge=30,
        le=140,
        description="키 (cm), 30~140 범위"
    )
    weight_kg: Optional[Decimal] = Field(
        None,
        ge=1,
        le=45,
        description="몸무게 (kg), 1~45 범위"
    )
    head_circumference_cm: Optional[Decimal] = Field(
        None,
        ge=20,
        le=62,
        description="머리 둘레 (cm), 20~62 범위"
    )
    activities: Optional[List[ActivityEnum]] = Field(
        None,
        description="활동 목록"
    )


class GrowthRecordCreate(RecordBase, GrowthRecordBase):
    """성장 기록 생성"""
    pass


class GrowthRecordUpdate(RecordBase):
    """성장 기록 수정"""
    height_cm: Optional[Decimal] = Field(None, ge=30, le=140, description="키 (cm)")
    weight_kg: Optional[Decimal] = Field(None, ge=1, le=45, description="몸무게 (kg)")
    head_circumference_cm: Optional[Decimal] = Field(None, ge=20, le=62, description="머리 둘레 (cm)")
    activities: Optional[List[ActivityEnum]] = Field(None, description="활동 목록")


class GrowthRecordResponse(BaseModel):
    """성장 기록 응답"""
    id: int
    height_cm: Optional[Decimal]
    weight_kg: Optional[Decimal]
    head_circumference_cm: Optional[Decimal]
    activities: Optional[List[ActivityEnum]]
    height_change: Optional[Decimal] = Field(None, description="키 변화량 (계산값)")
    weight_change: Optional[Decimal] = Field(None, description="몸무게 변화량 (계산값)")
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Meal Record (식사 기록)
# =============================================================================
class MealRecordBase(BaseModel):
    """식사 기록 기본 필드"""
    meal_datetime: datetime = Field(..., description="식사 일시")
    unknown_time: bool = Field(False, description="시간 모름 여부")
    duration_minutes: Optional[int] = Field(
        None,
        ge=0,
        le=60,
        description="식사 시간 (분)"
    )
    meal_type: MealTypeEnum = Field(..., description="음식 유형")
    meal_detail: Optional[str] = Field(None, max_length=200, description="음식 종류 상세")
    amount_ml: Optional[int] = Field(
        None,
        ge=0,
        le=500,
        description="양 (ml) - 젖병/이유식/분유용"
    )
    amount_text: Optional[str] = Field(
        None,
        max_length=100,
        description="양 (텍스트) - 간식/기타용"
    )
    burp: bool = Field(False, description="트림 여부")


class MealRecordCreate(RecordBase, MealRecordBase):
    """식사 기록 생성"""
    pass


class MealRecordUpdate(RecordBase):
    """식사 기록 수정"""
    meal_datetime: Optional[datetime] = Field(None, description="식사 일시")
    unknown_time: Optional[bool] = Field(None, description="시간 모름 여부")
    duration_minutes: Optional[int] = Field(None, ge=0, le=60, description="식사 시간 (분)")
    meal_type: Optional[MealTypeEnum] = Field(None, description="음식 유형")
    meal_detail: Optional[str] = Field(None, max_length=200, description="음식 종류 상세")
    amount_ml: Optional[int] = Field(None, ge=0, le=500, description="양 (ml)")
    amount_text: Optional[str] = Field(None, max_length=100, description="양 (텍스트)")
    burp: Optional[bool] = Field(None, description="트림 여부")


class MealRecordResponse(BaseModel):
    """식사 기록 응답"""
    id: int
    meal_datetime: datetime
    unknown_time: bool
    duration_minutes: Optional[int]
    meal_type: MealTypeEnum
    meal_detail: Optional[str]
    amount_ml: Optional[int]
    amount_text: Optional[str]
    burp: bool
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Health Record (건강 기록)
# =============================================================================
class HealthRecordBase(BaseModel):
    """건강 기록 기본 필드"""
    health_datetime: datetime = Field(..., description="건강 기록 일시")
    unknown_time: bool = Field(False, description="시간 모름 여부")
    title: str = Field(..., max_length=200, description="제목")
    symptoms: Optional[List[SymptomEnum]] = Field(None, description="증상 목록")
    medicines: Optional[List[MedicineEnum]] = Field(None, description="투약 현황 목록")


class HealthRecordCreate(RecordBase, HealthRecordBase):
    """건강 기록 생성"""
    pass


class HealthRecordUpdate(RecordBase):
    """건강 기록 수정"""
    health_datetime: Optional[datetime] = Field(None, description="건강 기록 일시")
    unknown_time: Optional[bool] = Field(None, description="시간 모름 여부")
    title: Optional[str] = Field(None, max_length=200, description="제목")
    symptoms: Optional[List[SymptomEnum]] = Field(None, description="증상 목록")
    medicines: Optional[List[MedicineEnum]] = Field(None, description="투약 현황 목록")


class HealthRecordResponse(BaseModel):
    """건강 기록 응답"""
    id: int
    health_datetime: datetime
    unknown_time: bool
    title: str
    symptoms: Optional[List[SymptomEnum]]
    medicines: Optional[List[MedicineEnum]]
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Diaper Record (배변 기록)
# =============================================================================
class DiaperRecordBase(BaseModel):
    """배변 기록 기본 필드"""
    diaper_datetime: datetime = Field(..., description="배변 일시")
    unknown_time: bool = Field(False, description="시간 모름 여부")
    diaper_type: DiaperTypeEnum = Field(..., description="배변 종류 (소변/대변/둘다)")
    amount: Optional[StoolAmountEnum] = Field(None, description="양")
    condition: Optional[StoolConditionEnum] = Field(None, description="상태")
    color: Optional[StoolColorEnum] = Field(None, description="색깔")


class DiaperRecordCreate(RecordBase, DiaperRecordBase):
    """배변 기록 생성"""
    pass


class DiaperRecordUpdate(RecordBase):
    """배변 기록 수정"""
    diaper_datetime: Optional[datetime] = Field(None, description="배변 일시")
    unknown_time: Optional[bool] = Field(None, description="시간 모름 여부")
    diaper_type: Optional[DiaperTypeEnum] = Field(None, description="배변 종류")
    amount: Optional[StoolAmountEnum] = Field(None, description="양")
    condition: Optional[StoolConditionEnum] = Field(None, description="상태")
    color: Optional[StoolColorEnum] = Field(None, description="색깔")


class DiaperRecordResponse(BaseModel):
    """배변 기록 응답"""
    id: int
    diaper_datetime: datetime
    unknown_time: bool
    diaper_type: DiaperTypeEnum
    amount: Optional[StoolAmountEnum]
    condition: Optional[StoolConditionEnum]
    color: Optional[StoolColorEnum]
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Etc Record (기타 기록)
# =============================================================================
class EtcRecordBase(BaseModel):
    """기타 기록 기본 필드"""
    title: str = Field(..., max_length=200, description="제목")


class EtcRecordCreate(RecordBase, EtcRecordBase):
    """기타 기록 생성"""
    pass


class EtcRecordUpdate(RecordBase):
    """기타 기록 수정"""
    title: Optional[str] = Field(None, max_length=200, description="제목")


class EtcRecordResponse(BaseModel):
    """기타 기록 응답"""
    id: int
    title: str
    record: Optional[RecordResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# Extended Record Response (확장 응답 - 상세 포함)
# =============================================================================
class RecordWithDetailsResponse(RecordResponse):
    """상세 정보가 포함된 기록 응답"""
    # Sleep details
    sleep_type: Optional[SleepTypeEnum] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    sleep_quality: Optional[SleepQualityEnum] = None
    duration_hours: Optional[float] = None

    # Growth details
    height_cm: Optional[Decimal] = None
    weight_kg: Optional[Decimal] = None
    head_circumference_cm: Optional[Decimal] = None
    activities: Optional[List[ActivityEnum]] = None
    height_change: Optional[Decimal] = None
    weight_change: Optional[Decimal] = None

    # Meal details
    meal_datetime: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meal_type: Optional[MealTypeEnum] = None
    meal_detail: Optional[str] = None
    amount_ml: Optional[int] = None
    amount_text: Optional[str] = None
    burp: Optional[bool] = None

    # Health details
    health_datetime: Optional[datetime] = None
    title: Optional[str] = None
    symptoms: Optional[List[SymptomEnum]] = None
    medicines: Optional[List[MedicineEnum]] = None

    # Diaper details
    diaper_datetime: Optional[datetime] = None
    diaper_type: Optional[DiaperTypeEnum] = None
    amount: Optional[StoolAmountEnum] = None
    condition: Optional[StoolConditionEnum] = None
    color: Optional[StoolColorEnum] = None

    # Etc details (title은 Health와 공유)

    # 공통
    unknown_time: Optional[bool] = None

    class Config:
        from_attributes = True


# =============================================================================
# Record List Response (목록 응답)
# =============================================================================
class RecordListResponse(BaseModel):
    """기록 목록 응답"""
    records: List[RecordWithDetailsResponse]
    total: int
    page: int
    limit: int


# =============================================================================
# Daily Summary Response (일별 요약 - 카드 표시용)
# =============================================================================
class SleepSummary(BaseModel):
    """수면 요약 (카드용)"""
    total_hours: float = Field(..., description="총 수면 시간")
    records: List[dict] = Field(..., description="수면 기록 목록")


class GrowthSummary(BaseModel):
    """성장 요약 (카드용)"""
    last_record: str = Field(..., description="마지막 기록 시점")
    height: Optional[dict] = Field(None, description="키 정보 (value, change)")
    weight: Optional[dict] = Field(None, description="몸무게 정보 (value, change)")
    activities: Optional[List[str]] = Field(None, description="활동 목록")


class MealSummary(BaseModel):
    """식사 요약 (카드용)"""
    total_count: int = Field(..., description="총 식사 횟수")
    records: List[dict] = Field(..., description="식사 기록 목록")


class HealthSummary(BaseModel):
    """건강 요약 (카드용)"""
    last_record: str = Field(..., description="마지막 기록 시점")
    note: Optional[str] = Field(None, description="메모/제목")
    date: Optional[str] = Field(None, description="기록 날짜")
    symptoms: Optional[List[str]] = Field(None, description="증상 목록")
    medicine: Optional[List[str]] = Field(None, description="투약 목록")


class DiaperSummary(BaseModel):
    """배변 요약 (카드용)"""
    last_record: str = Field(..., description="마지막 기록 시점")
    records: List[dict] = Field(..., description="배변 기록 목록")


class EtcSummary(BaseModel):
    """기타 요약 (카드용)"""
    records: List[dict] = Field(..., description="기타 기록 목록")


class DailySummaryResponse(BaseModel):
    """일별 요약 응답 (RecordCards 컴포넌트용)"""
    date: date
    sleep: Optional[SleepSummary] = None
    growth: Optional[GrowthSummary] = None
    meal: Optional[MealSummary] = None
    health: Optional[HealthSummary] = None
    diaper: Optional[DiaperSummary] = None
    etc: Optional[EtcSummary] = None
