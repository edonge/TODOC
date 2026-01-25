from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InsightResponse(BaseModel):
    """인사이트 API 응답"""
    category: str  # sleep, meal, diaper, health, growth, etc
    category_label: str  # 수면, 식사, 배변, 건강, 성장, 기타
    insight_text: str
    generated_at: datetime
    kid_name: Optional[str] = None

    class Config:
        from_attributes = True


class InsightCreate(BaseModel):
    """인사이트 생성용 내부 스키마"""
    user_id: int
    kid_id: int
    category: str
    insight_text: str
