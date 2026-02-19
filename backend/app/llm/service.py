from datetime import datetime, timedelta
import re
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models import Kid, Record
from app.core.config import settings
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

    def _describe(self, record: Record) -> str:
        """기록을 문자열로 변환"""
        detail = record.memo or ""

        if record.sleep_record:
            sr = record.sleep_record
            parts = [f"{sr.sleep_type.value}"]
            parts.append(f"{sr.duration_hours}시간")
            parts.append(f"{sr.start_datetime:%H:%M}~{sr.end_datetime:%H:%M}")
            if sr.sleep_quality:
                parts.append(f"수면질 {sr.sleep_quality.value}")
            detail = "수면 " + ", ".join(parts)
        elif record.meal_record:
            mr = record.meal_record
            parts = [f"{mr.meal_type.value}"]
            if mr.meal_detail:
                parts.append(mr.meal_detail)
            if mr.amount_ml:
                parts.append(f"{mr.amount_ml}ml")
            if mr.amount_text:
                parts.append(mr.amount_text)
            if mr.duration_minutes:
                parts.append(f"{mr.duration_minutes}분")
            if mr.burp:
                parts.append("트림함")
            detail = "식사 " + ", ".join(parts)
        elif record.diaper_record:
            dr = record.diaper_record
            parts = [dr.diaper_type.value]
            if dr.amount:
                parts.append(dr.amount.value)
            if dr.condition:
                parts.append(dr.condition.value)
            if dr.color:
                parts.append(dr.color.value)
            detail = "배변 (" + ", ".join(parts) + ")"
        elif record.health_record:
            hr = record.health_record
            parts = [hr.title]
            if hr.symptoms:
                parts.append("증상 " + ", ".join([s.value for s in hr.symptoms]))
            if hr.medicines:
                parts.append("투약 " + ", ".join([m.value for m in hr.medicines]))
            detail = "건강 " + ", ".join(parts)
        elif record.growth_record:
            gr = record.growth_record
            parts = []
            if gr.height_cm:
                parts.append(f"키 {gr.height_cm}cm")
            if gr.weight_kg:
                parts.append(f"몸무게 {gr.weight_kg}kg")
            if gr.head_circumference_cm:
                parts.append(f"머리둘레 {gr.head_circumference_cm}cm")
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


def _needs_personalization(message: str) -> bool:
    if not message:
        return False
    keywords = [
        "수유", "모유", "분유", "이유식", "식단", "영양", "간식",
        "수면", "잠", "낮잠", "밤잠", "루틴",
        "성장", "키", "몸무게", "체중", "머리둘레", "발달",
        "배변", "기저귀", "설사", "변비",
    ]
    return any(k in message for k in keywords)


def _is_medical_question(message: str) -> bool:
    """증상·건강 상담 여부 감지 — 의료 안전 규칙을 특히 준수해야 하는 질문"""
    if not message:
        return False
    keywords = [
        "열", "발열", "기침", "콧물", "구토", "설사", "발진", "두드러기",
        "경련", "발작", "숨", "호흡", "청색증", "의식", "응급",
        "병원", "소아과", "아프", "아파", "증상", "약", "처방",
        "예방접종", "백신", "변비", "탈수", "체온", "고열",
    ]
    return any(k in message for k in keywords)


def _is_emotional_support(message: str) -> bool:
    """부모 감정 지원 여부 감지 — 공감 우선, 심리 진단 금지"""
    if not message:
        return False
    keywords = [
        "힘들", "지쳐", "우울", "번아웃", "못하겠", "포기",
        "불안", "걱정", "무서", "외로", "죄책감", "자책",
        "산후", "육아 스트레스", "감정", "화가 나", "억울",
        "눈물", "울고 싶", "자신 없", "버겁",
    ]
    return any(k in message for k in keywords)


def _is_growth_compare_question(message: str) -> bool:
    """성장 비교 질문 여부 감지 — 아이 정보(키·몸무게·개월수) 활용 필수"""
    if not message:
        return False
    keywords = [
        "정상", "평균", "큰 편", "작은 편", "또래", "백분위",
        "성장 곡선", "성장곡선", "표준", "비교", "편차",
        "몇 퍼센트", "몇 kg", "몇 cm", "개월 평균",
    ]
    return any(k in message for k in keywords)


def _build_care_hints(is_medical: bool, is_emotional: bool, is_growth: bool) -> str:
    """질문 유형에 따른 추가 지침 문자열 생성 — 안전 규칙 강조용"""
    hints = []
    if is_medical:
        hints.append("⚕️ 이 질문은 증상·건강 상담입니다. 의료 안전 규칙(진단 금지, 전문의 상담 권장, 응급 증상 확인)을 특히 준수하세요.")
    if is_emotional:
        hints.append("💙 이 질문은 부모의 감정 지원 요청입니다. 공감과 위로를 우선하고 심리 진단·병명 추정은 절대 하지 마세요.")
    if is_growth:
        hints.append("📏 이 질문은 성장 비교 질문입니다. [Kid] 블록의 개월 수·키·몸무게를 활용해 개인화된 답변을 제공하세요.")
    return "\n".join(hints)


def _is_kid_info_question(message: str) -> bool:
    if not message:
        return False
    keywords = [
        "몇살", "나이", "개월", "생년월일", "성별", "이름", "아기 이름",
        "우리애", "우리 아이", "아이 정보", "키", "몸무게",
        "머리둘레", "두위", "성장", "큰편", "작은편", "평균", "비교",
    ]
    return any(k in message for k in keywords)


def _extract_doc_names(rag_output: str) -> List[str]:
    """RAG 도구 출력에서 참조 문서명 추출 (중복 제거, 파일 확장자 정리)

    tools.py의 RAG 출력 형식: "[파일명.pdf] 본문 내용..."
    각 스니펫은 줄 첫머리에서 [레이블]로 시작하므로, ^앵커로만 매칭해
    본문 내 [표 1], [그림 2] 같은 인텍스트 참조를 걸러낸다.
    """
    if not rag_output:
        return []
    # 줄 첫머리([...]) 만 매칭 — 본문 중간의 [표 1], [그림 3] 제외
    raw = re.findall(r'^\[([^\]]+)\]', rag_output, re.MULTILINE)
    seen: set = set()
    result = []
    for name in raw:
        clean = re.sub(r'_openai_faiss\.pkl$', '', name)
        clean = re.sub(r'\.(pkl|pdf)$', '', clean)
        # 파일명 자체가 [기관명]_문서명 형태인 경우 앞뒤 대괄호 제거
        clean = clean.strip('[]').strip()
        # 6자 미만은 표·그림·번호 등 인텍스트 참조로 간주하고 제외
        if clean and len(clean) >= 6 and clean not in seen:
            seen.add(clean)
            result.append(clean)
    return result


def _strip_source_footer(text: str) -> str:
    if not text:
        return text
    lines = text.splitlines()
    filtered = []
    for line in lines:
        trimmed = line.strip()
        if trimmed.startswith("📚 참고") or trimmed.startswith("참고:"):
            continue
        filtered.append(line)
    return "\n".join(filtered).strip()


async def generate_response(
    message: str,
    mode: str = "chat",
    history: List[dict] = None,
    kid: Optional[Kid] = None,
    db: Optional[Session] = None,
) -> dict:
    """
    AI 응답 생성 (통합 모드)
    Returns:
        dict: {
            "output": str,
            "tools_called": List[str],
            "rag_used": bool,
            "kid_info_used": bool,
        }
    """
    if history is None:
        history = []

    diary = DiaryContextBuilder(kid, db)
    kid_snapshot = diary.kid_snapshot()

    is_medical = _is_medical_question(message)
    is_emotional = _is_emotional_support(message)
    is_growth = _is_growth_compare_question(message)
    personalize = (
        _needs_personalization(message)
        or _is_kid_info_question(message)
        or is_medical   # 의료 상담은 아이 월령·기록 필수
        or is_growth    # 성장 비교는 아이 수치 필수
    )

    tools = [build_rag_tool("chat"), *build_diary_tools(diary), build_web_tool()]

    executor, chat_history = build_agent(
        mode=mode,
        tools=tools,
        kid_snapshot=kid_snapshot,
        latest_record=diary.latest_record(),
        recent_digest=diary.recent_digest(),
        history=history,
        personalize=personalize,
        care_hints=_build_care_hints(is_medical, is_emotional, is_growth),
    )
    result = await executor.ainvoke({"input": message, "chat_history": chat_history})

    tools_called = []
    rag_used = False
    docs_used: List[str] = []
    if "intermediate_steps" in result:
        for step in result["intermediate_steps"]:
            if len(step) >= 1:
                action = step[0]
                tool_name = getattr(action, "tool", None)
                if tool_name:
                    tools_called.append(tool_name)
                    if tool_name == "rag_search":
                        rag_used = True
                        if len(step) >= 2:
                            for doc_name in _extract_doc_names(str(step[1])):
                                if doc_name not in docs_used:
                                    docs_used.append(doc_name)

    kid_info_used = kid is not None and "No kid selected" not in kid_snapshot
    output = result.get("output") if isinstance(result, dict) else str(result)
    output = _strip_source_footer(output)

    print(f"\n{'='*50}")
    print(f"[AI Chat Debug] kid_info_used={kid_info_used} tools={tools_called} rag={rag_used}")
    print(f"{'='*50}\n")

    return {
        "output": output,
        "tools_called": tools_called,
        "rag_used": rag_used,
        "kid_info_used": kid_info_used,
        "docs_used": docs_used,
    }
