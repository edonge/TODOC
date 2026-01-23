from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from langchain_core.prompts import ChatPromptTemplate

from app.models import Kid, Record
from app.models.enums import RecordTypeEnum
from app.llm.agent import build_llm
from app.llm.vector_loader import load_mode_stores
from app.core.config import settings


def _format_record(rec: Record) -> str:
    """일지 1건을 짧게 요약 문자열로 변환."""
    base = f"{rec.created_at:%Y-%m-%d} [{rec.record_type.value}]"
    detail = ""
    if rec.record_type == RecordTypeEnum.growth and rec.growth_record:
        h = rec.growth_record.height_cm
        w = rec.growth_record.weight_kg
        detail = f"키 {h}cm, 몸무게 {w}kg"
    elif rec.record_type == RecordTypeEnum.health and rec.health_record:
        temp = rec.health_record.temperature
        sym = rec.health_record.symptom.value if rec.health_record.symptom else ""
        detail = f"증상 {sym}, 체온 {temp}"
    elif rec.record_type == RecordTypeEnum.sleep and rec.sleep_record:
        detail = f"수면 {rec.sleep_record.start_datetime}~{rec.sleep_record.end_datetime} ({rec.sleep_record.sleep_quality.value})"
    elif rec.record_type == RecordTypeEnum.meal and rec.meal_record:
        detail = f"식사 {rec.meal_record.meal_type.value}: {rec.meal_record.meal_detail or ''}"
    elif rec.record_type == RecordTypeEnum.stool and rec.stool_record:
        detail = f"배변 {rec.stool_record.amount.value}, 상태 {rec.stool_record.condition.value}, 색 {rec.stool_record.color.value}"
    else:
        detail = rec.memo or rec.title or ""
    return f"{base} :: {detail}".strip()


def _recent_records(db: Session, kid: Kid, days: int = 7, limit: int = 80) -> List[Record]:
    since = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(Record)
        .options(
            joinedload(Record.growth_record),
            joinedload(Record.health_record),
            joinedload(Record.sleep_record),
            joinedload(Record.meal_record),
            joinedload(Record.stool_record),
        )
        .filter(Record.kid_id == kid.id, Record.created_at >= since)
        .order_by(Record.created_at.desc())
        .limit(limit)
        .all()
    )


async def generate_weekly_summary(kid: Optional[Kid], db: Optional[Session]) -> str:
    """
    최근 7일 일지 + RAG(common, mom)로 한 줄 요약 생성.
    DB가 없거나 기록이 없으면 안내 메시지 반환.
    """
    if not db or not kid:
        return "최근 7일 요약을 만들 수 없습니다 (아이 또는 DB 정보가 없어요)."

    records = _recent_records(db, kid)
    if not records:
        return "최근 7일 동안 등록된 일지 기록이 없습니다."

    record_lines = "\n".join(_format_record(r) for r in records)
    kid_profile = f"이름: {kid.name}, 생년월일: {kid.birth_date}, 성별: {'남아' if kid.gender == 'male' else '여아'}"

    # RAG: 공통+맘 문서 우선 사용
    retriever = load_mode_stores(settings.vector_base_dir, ["common_docs", "mom_docs"])
    rag_context = ""
    if retriever:
        docs = retriever.invoke("최근 7일 아기 건강/성장/식습관 점검 체크리스트")
        rag_context = "\n\n".join(d.page_content for d in docs)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are Summary AI for the home dashboard.\n"
                "- Output: EXACTLY ONE Korean sentence (<=120자), 따뜻하고 상냥한 톤.\n"
                "- 내용: 최근 7일 동안의 성장/건강/수면/식사/배변 신호를 짧게 묶어 전달.\n"
                "- 이상 없으면 '건강하게 잘 지내고 있어요' 같은 긍정 멘트 포함.\n"
                "- 이상 징후가 보이면 짧게 언급 + '지속되면 병원/전문가 상담' 정도의 부드러운 제안 한 번만.\n"
                "- 과도한 조언이나 진단 금지, 수치는 간단히 언급할 때만 사용.\n"
                "- 이 한 줄은 매일 날짜가 바뀔 때마다 자동으로 새로 생성됨을 가정.",
            ),
            (
                "user",
                "아이 프로필:\n{kid_profile}\n\n최근 7일 일지:\n{records}\n\n참고 문서(RAG):\n{rag}",
            ),
        ]
    )

    llm = build_llm()  # Luxia 우선
    chain = prompt | llm
    result = await chain.ainvoke(
        {"kid_profile": kid_profile, "records": record_lines, "rag": rag_context}
    )
    return result.content if hasattr(result, "content") else str(result)
