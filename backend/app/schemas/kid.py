from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from enum import Enum


# =============================================================================
# Enum for Gender
# =============================================================================
class GenderEnum(str, Enum):
    """성별"""
    MALE = "male"
    FEMALE = "female"


# =============================================================================
# Kid Create / Update
# =============================================================================
class KidCreate(BaseModel):
    """아이 등록"""
    name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="아이 이름"
    )
    birth_date: date = Field(..., description="생년월일")
    gender: Optional[GenderEnum] = Field(None, description="성별 (male/female)")
    profile_image_url: Optional[str] = Field(None, description="프로필 이미지 URL")


class KidUpdate(BaseModel):
    """아이 정보 수정"""
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="아이 이름"
    )
    birth_date: Optional[date] = Field(None, description="생년월일")
    gender: Optional[GenderEnum] = Field(None, description="성별")
    profile_image_url: Optional[str] = Field(None, description="프로필 이미지 URL")


# =============================================================================
# Kid Response
# =============================================================================
class KidResponse(BaseModel):
    """아이 정보 응답"""
    id: int
    user_id: int
    name: str
    birth_date: date
    gender: Optional[GenderEnum] = None
    profile_image_url: Optional[str] = None
    age_in_months: Optional[int] = Field(None, description="개월 수 (계산값)")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KidBriefResponse(BaseModel):
    """아이 간략 정보 (목록 등에서 사용)"""
    id: int
    name: str
    birth_date: date
    profile_image_url: Optional[str] = None
    age_in_months: Optional[int] = None

    class Config:
        from_attributes = True


# =============================================================================
# Kid List Response
# =============================================================================
class KidListResponse(BaseModel):
    """아이 목록 응답"""
    kids: List[KidResponse]
    total: int


# =============================================================================
# Kid Dashboard (대시보드용)
# =============================================================================
class KidRecentRecords(BaseModel):
    """최근 기록 요약"""
    last_sleep: Optional[dict] = Field(None, description="최근 수면 기록")
    last_meal: Optional[dict] = Field(None, description="최근 식사 기록")
    last_diaper: Optional[dict] = Field(None, description="최근 배변 기록")
    last_growth: Optional[dict] = Field(None, description="최근 성장 기록")
    last_health: Optional[dict] = Field(None, description="최근 건강 기록")


class KidStats(BaseModel):
    """아이 통계"""
    total_records: int = Field(..., description="총 기록 수")
    records_this_week: int = Field(..., description="이번 주 기록 수")
    records_this_month: int = Field(..., description="이번 달 기록 수")
    avg_sleep_hours: Optional[float] = Field(None, description="평균 수면 시간")
    avg_meals_per_day: Optional[float] = Field(None, description="일 평균 식사 횟수")


class KidDashboard(BaseModel):
    """아이 대시보드"""
    kid: KidResponse
    recent_records: KidRecentRecords
    stats: KidStats
