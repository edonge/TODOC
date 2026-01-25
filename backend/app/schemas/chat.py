from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
  """단일 채팅 메시지"""

  id: Optional[int] = None
  session_id: Optional[int] = None
  sender: str  # "user" | "ai"
  content: str
  created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSessionSummary(BaseModel):
  """지난 채팅 내역 카드용 요약 정보"""

  id: int
  title: str
  question_snippet: str
  date_label: str  # ex) "01.25 어제"
  mode: str  # mom | doctor | nutrition
  kid_id: Optional[int] = None


class ChatRequest(BaseModel):
  mode: str
  message: str
  history: List[dict] = []
  kid_id: Optional[int] = None
  session_id: Optional[int] = None


class ChatDebugInfo(BaseModel):
  """디버그 정보 (개발용)"""
  tools_called: List[str] = []
  rag_used: bool = False
  kid_info_used: bool = False


class ChatResponse(BaseModel):
  reply: str
  session_id: Optional[int] = None
  mode: str
  date_label: str
  title: Optional[str] = None
  question_snippet: Optional[str] = None
  kid_id: Optional[int] = None
  kid_name: Optional[str] = None  # 아이 이름 (개인화 확인용)
  references: Optional[List[str]] = None  # RAG 참조 문서 목록
  _debug: Optional[ChatDebugInfo] = None  # 디버그 정보 (개발용)
