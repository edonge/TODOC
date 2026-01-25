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

    def _korean_subject(self, name: str) -> str:
        if not name:
            return ""
        last_char = name[-1]
        code = ord(last_char) - 0xAC00
        if code < 0 or code > 11171:
            return f"{name}가"
        jongseong = code % 28
        return f"{name}이" if jongseong else f"{name}가"

    def _short_name(self, name: str) -> str:
        if not name:
            return ""
        if len(name) >= 3:
            return name[1:]
        return name

    def _age_months(self) -> Optional[int]:
        if not self.kid or not getattr(self.kid, "birth_date", None):
            return None
        today = datetime.utcnow().date()
        birth = self.kid.birth_date
        months = (today.year - birth.year) * 12 + (today.month - birth.month)
        if today.day < birth.day:
            months -= 1
        return max(months, 0)

    def kid_snapshot(self) -> str:
        if not self.kid:
            return "No kid selected."
        gender = "남아" if getattr(self.kid, "gender", "") == "male" else "여아"
        short_name = self._short_name(self.kid.name)
        subject_name = self._korean_subject(short_name)
        age_months = self._age_months()
        age_text = f"{age_months}개월" if age_months is not None else "알 수 없음"
        return (
            f"- 이름: {short_name}\n"
            f"- 호칭: {subject_name}\n"
            f"- 생년월일: {self.kid.birth_date}\n"
            f"- 생후: {age_text}\n"
            f"- 성별: {gender}"
        )


def _needs_personalization(message: str, mode: str) -> bool:
    if not message:
        return False
    keywords = [
        "수유", "모유", "분유", "이유식", "식단", "영양", "간식",
        "수면", "잠", "낮잠", "밤잠", "루틴",
        "성장", "키", "몸무게", "체중", "머리둘레", "발달",
        "배변", "기저귀", "설사", "변비",
    ]
    return any(k in message for k in keywords) or mode in {"mom", "nutrition"}

    def _describe(self, record: Record) -> str:
        """기록을 문자열로 변환"""
        detail = record.memo or ""

        # 타입별 상세 정보 추가
        if record.sleep_record:
            sr = record.sleep_record
            detail = f"수면 {sr.duration_hours}시간"
        elif record.meal_record:
            mr = record.meal_record
            detail = f"식사 {mr.meal_type.value}"
            if mr.amount_ml:
                detail += f" {mr.amount_ml}ml"
        elif record.diaper_record:
            dr = record.diaper_record
            detail = f"배변 ({dr.diaper_type.value})"
        elif record.health_record:
            hr = record.health_record
            detail = f"건강 {hr.title}"
        elif record.growth_record:
            gr = record.growth_record
            parts = []
            if gr.height_cm:
                parts.append(f"키 {gr.height_cm}cm")
            if gr.weight_kg:
                parts.append(f"몸무게 {gr.weight_kg}kg")
            detail = "성장 " + ", ".join(parts) if parts else "성장 기록"
        elif record.etc_record:
            detail = f"기타: {record.etc_record.title}"

        return f"{record.created_at:%Y-%m-%d %H:%M} [{record.record_type.value}] {detail}"

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
                joinedload(Record.diaper_record),
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
) -> dict:
    """
    AI 응답 생성
    Returns:
        dict: {
            "output": str,  # AI 응답
            "tools_called": List[str],  # 호출된 도구 목록
            "rag_used": bool,  # RAG 검색 여부
            "kid_info_used": bool,  # 아이 정보 사용 여부
        }
    """
    diary = DiaryContextBuilder(kid, db)
    tools = [build_rag_tool(mode), *build_diary_tools(diary)]
    if mode == "nutrition":
        tools.append(build_web_tool())

    kid_snapshot = diary.kid_snapshot()

    personalize = _needs_personalization(message, mode)
    executor, chat_history = build_agent(
        mode=mode,
        tools=tools,
        kid_snapshot=kid_snapshot,
        latest_record=diary.latest_record(),
        recent_digest=diary.recent_digest(),
        history=history,
        personalize=personalize,
    )
    result = await executor.ainvoke({"input": message, "chat_history": chat_history})

    # 도구 호출 내역 분석
    tools_called = []
    rag_used = False

    if "intermediate_steps" in result:
        for step in result["intermediate_steps"]:
            if len(step) >= 1:
                action = step[0]
                tool_name = getattr(action, 'tool', None)
                if tool_name:
                    tools_called.append(tool_name)
                    if tool_name == "rag_search":
                        rag_used = True

    # 아이 정보 사용 여부 (시스템 프롬프트에 포함됨)
    kid_info_used = kid is not None and "No kid selected" not in kid_snapshot

    output = result.get("output") if isinstance(result, dict) else str(result)
    if rag_used and "문서 기반" not in output:
        output = f"{output}\n\n이 답변은 신뢰도 있는 문서 기반으로 생성되었어요!"

    # 콘솔 로그 (디버깅용)
    print(f"\n{'='*50}")
    print(f"[AI Chat Debug]")
    print(f"Mode: {mode}")
    print(f"Kid info used: {kid_info_used}")
    print(f"Tools called: {tools_called}")
    print(f"RAG used: {rag_used}")
    print(f"{'='*50}\n")

    return {
        "output": output,
        "tools_called": tools_called,
        "rag_used": rag_used,
        "kid_info_used": kid_info_used,
    }
