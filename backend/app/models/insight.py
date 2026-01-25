from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base


class UserInsight(Base):
    """
    사용자 인사이트 캐시 테이블
    - 하루 2회 (00시, 12시) 갱신
    - 최근 7일 기록 기반 LLM 생성 인사이트
    """

    __tablename__ = "user_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kid_id = Column(Integer, ForeignKey("kids.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # sleep, meal, diaper, health, growth, etc
    insight_text = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    kid = relationship("Kid")
