from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base


class ChatSession(Base):
    """
    채팅 세션 메타정보 테이블
    - title/question_snippet/date_label: 지난 채팅 카드 요약에 사용
    - mode: mom | doctor | nutrition
    - kid_id: 선택적으로 해당 아이와 연결
    """

    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    question_snippet = Column(String(500), nullable=True)
    date_label = Column(String(50), nullable=True)  # 예: "01.25 어제"
    kid_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """
    단일 채팅 메시지 저장
    sender: "user" | "ai"
    """

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ChatSession", back_populates="messages")
