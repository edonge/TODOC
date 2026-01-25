from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models import Kid, Record
from .tools import (
    build_rag_tool,
    build_diary_tools,
    build_web_tool,
)
from .agent import build_agent


class DiaryContextBuilder:
    def __init__(self, kid: Optional[Kid], db: Optional[Session]):
        self.kid = kid
        self.db = db

    def kid_snapshot(self) -> str:
        if not self.kid:
            return "No kid selected."
        gender = "남아" if getattr(self.kid, "gender", "") == "male" else "여아"
        return f"- 이름: {self.kid.name}\n- 생년월일: {self.kid.birth_date}\n- 성별: {gender}"

    def _describe(self, record: Record) -> str:
        return f"{record.created_at} [{record.record_type.value}] :: {record.memo or record.title or ''}"

    def latest_record(self) -> str:
        if not (self.db and self.kid):
            return "No latest record available (DB not ready)."
        rec = (
            self.db.query(Record)
            .options(
                joinedload(Record.growth_record),
                joinedload(Record.health_record),
                joinedload(Record.sleep_record),
                joinedload(Record.meal_record),
                joinedload(Record.stool_record),
            )
            .filter(Record.kid_id == self.kid.id)
            .order_by(Record.created_at.desc())
            .first()
        )
        return self._describe(rec) if rec else "No latest record."

    def recent_digest(self, days: int = 7, limit: int = 50) -> str:
        if not (self.db and self.kid):
            return "Recent diary digest unavailable (DB not ready)."
        since = datetime.utcnow() - timedelta(days=days)
        recs = (
            self.db.query(Record)
            .filter(Record.kid_id == self.kid.id, Record.created_at >= since)
            .order_by(Record.created_at.desc())
            .limit(limit)
            .all()
        )
        if not recs:
            return "No diary records in the last 7 days."
        return "\n".join(self._describe(r) for r in recs)


async def generate_response(
    message: str,
    mode: str,
    history: List[dict],
    kid: Optional[Kid] = None,
    db: Optional[Session] = None,
) -> str:
    diary = DiaryContextBuilder(kid, db)
    tools = [build_rag_tool(mode), *build_diary_tools(diary)]
    if mode == "nutrition":
        tools.append(build_web_tool())

    executor, chat_history = build_agent(
        mode=mode,
        tools=tools,
        kid_snapshot=diary.kid_snapshot(),
        latest_record=diary.latest_record(),
        recent_digest=diary.recent_digest(),
        history=history,
    )
    result = await executor.ainvoke({"input": message, "chat_history": chat_history})
    return result.get("output") if isinstance(result, dict) else str(result)
