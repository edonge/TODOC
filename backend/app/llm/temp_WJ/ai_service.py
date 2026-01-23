from __future__ import annotations

import asyncio
import requests
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langdetect import LangDetectException, detect
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models import (
    GrowthRecord,
    HealthRecord,
    Kid,
    MealRecord,
    Post,
    Record,
    SleepRecord,
    StoolRecord,
)
from app.models.enums import CommunityCategoryEnum, RecordTypeEnum
from app.rag.vector_store_utils import search_vector_dirs

# Paths for the new folder-based vector DB layout
BASE_VECTOR_DIR = Path(__file__).resolve().parents[1] / "rag" / "vector_db"
MODE_TO_DIRS = {
    "mom": ["mom_docs", "common_docs"],
    "doctor": ["doctor_docs", "common_docs"],
    "nutrition": ["nutrient_docs", "common_docs"],
}


def _language_label(language_code: str) -> str:
    mapping = {
        "ko": "Korean honorific speech",
        "en": "English",
        "ja": "Japanese",
        "zh-cn": "Chinese",
        "zh-tw": "Chinese",
        "es": "Spanish",
        "fr": "French",
    }
    return mapping.get(language_code.lower(), language_code.upper())


def _safe_lang_detect(text: str) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return "ko"
    try:
        return detect(cleaned)
    except LangDetectException:
        # If it contains Hangul, assume Korean
        if any("\uac00" <= char <= "\ud7a3" for char in cleaned):
            return "ko"
        return "en"


def _format_decimal(value: Optional[float]) -> str:
    if value is None:
        return ""
    return str(value)


class RagRouter:
    """Resolve and search vector stores per mode with the new directory layout."""

    def __init__(self, base_dir: Path = BASE_VECTOR_DIR):
        self.base_dir = base_dir

    def _resolve_dirs(self, mode: str) -> List[Path]:
        folder_names = MODE_TO_DIRS.get(mode, MODE_TO_DIRS["mom"])
        return [self.base_dir / name for name in folder_names]

    def search(self, mode: str, query: str, top_k: int = 4, score_threshold: float = 0.25) -> str:
        dirs = self._resolve_dirs(mode)
        return search_vector_dirs(query, dirs, top_k=top_k, score_threshold=score_threshold)


class DiaryContextBuilder:
    """Builds kid-centric context from DB records."""

    def __init__(self, kid: Optional[Kid], db: Optional[Session]):
        self.kid = kid
        self.db = db

    def kid_snapshot(self, language_code: str) -> str:
        if not self.kid:
            return "No kid selected."
        is_ko = language_code.lower() == "ko"
        name = self.kid.name
        birth = self.kid.birth_date
        gender = self.kid.gender
        if is_ko:
            gender_label = "남아" if gender == "male" else "여아"
            return f"- 아이: {name}\n- 생년월일: {birth}\n- 성별: {gender_label}"
        return f"- Child: {name}\n- Birth date: {birth}\n- Gender: {'Boy' if gender == 'male' else 'Girl'}"

    def _describe_record(self, record: Record) -> str:
        base = f"{record.created_at} [{record.record_type.value}]"
        detail = ""
        if record.record_type == RecordTypeEnum.growth and record.growth_record:
            height = _format_decimal(record.growth_record.height_cm)
            weight = _format_decimal(record.growth_record.weight_kg)
            detail = f"height {height}cm, weight {weight}kg"
        elif record.record_type == RecordTypeEnum.health and record.health_record:
            temp = _format_decimal(record.health_record.temperature)
            symptom = record.health_record.symptom.value if record.health_record.symptom else ""
            detail = f"symptom {symptom}, temp {temp}"
        elif record.record_type == RecordTypeEnum.sleep and record.sleep_record:
            start = record.sleep_record.start_datetime
            end = record.sleep_record.end_datetime
            quality = record.sleep_record.sleep_quality.value
            detail = f"sleep {start} -> {end} ({quality})"
        elif record.record_type == RecordTypeEnum.meal and record.meal_record:
            meal_type = record.meal_record.meal_type.value
            meal_detail = record.meal_record.meal_detail or ""
            detail = f"meal {meal_type}: {meal_detail}"
        elif record.record_type == RecordTypeEnum.stool and record.stool_record:
            detail = (
                f"stool amount {record.stool_record.amount.value}, "
                f"condition {record.stool_record.condition.value}, "
                f"color {record.stool_record.color.value}"
            )
        else:
            detail = record.memo or record.title or ""
        memo = f" | memo: {record.memo}" if record.memo else ""
        return f"{base} :: {detail}{memo}"

    def latest_record(self) -> str:
        if not self.db or not self.kid:
            return "No latest record available."
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
        if not rec:
            return "No latest record available."
        return self._describe_record(rec)

    def recent_digest(self, days: int = 7, limit: int = 50) -> str:
        if not self.db or not self.kid:
            return "Recent diary digest unavailable (no DB or kid)."
        since = datetime.utcnow() - timedelta(days=days)
        records = (
            self.db.query(Record)
            .options(
                joinedload(Record.growth_record),
                joinedload(Record.health_record),
                joinedload(Record.sleep_record),
                joinedload(Record.meal_record),
                joinedload(Record.stool_record),
            )
            .filter(Record.kid_id == self.kid.id, Record.created_at >= since)
            .order_by(Record.created_at.desc())
            .limit(limit)
            .all()
        )
        if not records:
            return "No diary records in the last 7 days."
        lines = [self._describe_record(rec) for rec in records]
        return "\n".join(lines)


class RecipeSearcher:
    """Search recipe posts in the community DB."""

    def __init__(self, db: Optional[Session]):
        self.db = db

    def search(self, query: str, limit: int = 5) -> str:
        if not self.db:
            return "Recipe search unavailable (no DB)."
        q = (
            self.db.query(Post)
            .filter(Post.category == CommunityCategoryEnum.recipe.value)
            .order_by(Post.created_at.desc())
        )
        if query:
            like = f"%{query}%"
            q = q.filter(or_(Post.title.ilike(like), Post.content.ilike(like)))
        posts = q.limit(limit).all()
        if not posts:
            return "No recipe posts found for this topic."
        formatted = []
        for post in posts:
            formatted.append(
                f"- [{post.id}] {post.title} (likes {post.likes_count}) :: {post.content[:240]}..."
            )
        return "\n".join(formatted)


@lru_cache(maxsize=16)
def _mode_prompt(mode: str) -> str:
    if mode == "doctor":
        return """You are Doctor AI for infant/toddler health consultations.
- Use tools when helpful; prefer concise, evidence-based guidance.
- If a question is about parenting tips/education, suggest switching to Mom AI.
- If a question is about diet/nutrition/recipes, suggest switching to Nutrient AI.
- If unsure or data is missing, say so rather than inventing details.
- Safety: for emergencies (breathing difficulty, LOC, persistent high fever, seizures), advise immediate ER visit; no prescriptions; remind to consult clinicians.
Context blocks below are optional; ask clarifying questions if needed."""
    if mode == "nutrition":
        return """You are Nutrition AI focusing on infant/toddler diet, allergy safety, choking risks, and recipes.
- Use tools when helpful; prioritize practical, safe advice.
- For medical symptom/care questions, suggest switching to Doctor AI.
- For general parenting/education questions, suggest switching to Mom AI (default if ambiguous).
- If unsure or data is missing, say you need more info; avoid hallucinations.
- Safety: highlight allergens/choking hazards; avoid prescribing medication; prompt professional advice when risk is high.
You can pull from docs, diary, community recipes, and (if available) web search."""
    return """You are Mom AI providing day-to-day parenting help (sleep, routines, play, hygiene, tips).
- Use tools when helpful; keep tone warm but concise.
- For medical symptom/care questions, suggest switching to Doctor AI.
- For diet/nutrition/recipes questions, suggest switching to Nutrient AI.
- If unsure or data is missing, ask for clarification instead of guessing.
- Safety: avoid medical or prescription claims; encourage professional help when risk is suspected.
Context blocks below are optional; ask clarifying questions if needed."""


def _mode_tool_descriptions(mode: str) -> List[str]:
    base = [
        "rag_search: retrieve high-confidence snippets from vector docs relevant to the question.",
        "diary_recent: digest of the last 7 days of diary entries.",
        "diary_latest: most recent diary entry for immediacy.",
    ]
    if mode == "nutrition":
        base.append("recipe_search: fetch recent community recipe posts (title/content).")
        base.append("web_search: lightweight web search if enabled by environment.")
    return base


class AIService:
    def __init__(self):
        self.rag_router = RagRouter()

    def _chat_model(self) -> ChatOpenAI:
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.2,
            max_tokens=800,
        )

    def _to_history_messages(self, conversation_history: List[Dict[str, str]]) -> List[BaseMessage]:
        history: List[BaseMessage] = []
        for item in sorted(conversation_history, key=lambda x: x.get("created_at") or 0):
            if item.get("sender") == "user":
                history.append(HumanMessage(content=item.get("message", "")))
            else:
                history.append(AIMessage(content=item.get("message", "")))
        return history

    def _build_tools(
        self,
        mode: str,
        kid: Optional[Kid],
        db: Optional[Session],
        diary_builder: DiaryContextBuilder,
    ) -> List[Tool]:
        tools: List[Tool] = []

        def rag_tool(query: str) -> str:
            return self.rag_router.search(mode, query)

        tools.append(
            Tool.from_function(
                name="rag_search",
                func=rag_tool,
                description=f"Search {mode} + common vector docs for the user question.",
            )
        )

        def diary_recent(user_focus: str = "") -> str:
            return diary_builder.recent_digest()

        def diary_latest(user_focus: str = "") -> str:
            return diary_builder.latest_record()

        tools.append(
            Tool.from_function(
                name="diary_recent",
                func=diary_recent,
                description="Summarized diary records from the last 7 days (cached-ish).",
            )
        )
        tools.append(
            Tool.from_function(
                name="diary_latest",
                func=diary_latest,
                description="Most recent diary entry for immediate context.",
            )
        )

        if mode == "nutrition":
            recipe_searcher = RecipeSearcher(db=db)

            def recipe_search(query: str) -> str:
                return recipe_searcher.search(query)

            tools.append(
                Tool.from_function(
                    name="recipe_search",
                    func=recipe_search,
                    description="Community recipe posts that may match the topic.",
                )
            )

            def web_search(query: str) -> str:
                """
                Lightweight web search using DuckDuckGo instant answer API.
                Returns top snippets; if network blocked or fails, returns a graceful message.
                """
                try:
                    resp = requests.get(
                        "https://api.duckduckgo.com/",
                        params={"q": query, "format": "json", "no_redirect": 1, "no_html": 1},
                        timeout=6,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    snippets: List[str] = []
                    abstract = data.get("AbstractText")
                    if abstract:
                        snippets.append(f"- Abstract: {abstract[:320]}...")
                    for topic in data.get("RelatedTopics", [])[:3]:
                        text = topic.get("Text")
                        if text:
                            snippets.append(f"- {text[:320]}...")
                    if not snippets:
                        return "Web search returned no useful snippets."
                    return "\n".join(snippets)
                except Exception as exc:
                    return f"Web search unavailable or failed: {exc}"

            tools.append(
                Tool.from_function(
                    name="web_search",
                    func=web_search,
                    description="Last-resort lightweight web search for diet/recipe ideas if configured.",
                )
            )

        return tools

    def _build_system_prompt(
        self,
        mode: str,
        language_code: str,
        kid_snapshot: str,
        latest_record: str,
        recent_digest: str,
    ) -> str:
        prompt_header = _mode_prompt(mode)
        language_label = _language_label(language_code)
        tool_lines = "\n- ".join(_mode_tool_descriptions(mode))
        return (
            f"{prompt_header}\n"
            f"- Respond in {language_label} matching the user's language.\n"
            f"- Available tools:\n- {tool_lines}\n"
            "Use tools only when they add value; keep latency reasonable.\n"
            "Context blocks (use if relevant, ignore if empty):\n"
            f"[Kid]\n{kid_snapshot}\n"
            f"[Latest record]\n{latest_record}\n"
            f"[Recent 7-day digest]\n{recent_digest}\n"
            "If data is missing, be transparent. Never fabricate medical instructions."
        )

    def _build_agent_executor(
        self,
        mode: str,
        language_code: str,
        kid_snapshot: str,
        latest_record: str,
        recent_digest: str,
        tools: List[Tool],
    ) -> AgentExecutor:
        system_prompt = self._build_system_prompt(
            mode=mode,
            language_code=language_code,
            kid_snapshot=kid_snapshot,
            latest_record=latest_record,
            recent_digest=recent_digest,
        )
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("user", "{input}"),
            ]
        )
        llm = self._chat_model()
        agent = create_tool_calling_agent(llm, tools, prompt)
        return AgentExecutor(agent=agent, tools=tools, verbose=False, handle_parsing_errors=True)

    async def generate_response(
        self,
        message: str,
        ai_mode: str,
        conversation_history: List[Dict[str, str]],
        kid: Optional[Kid] = None,
        db: Optional[Session] = None,
        rag_context: Optional[str] = None,  # kept for backward compatibility; unused now
    ) -> str:
        if not settings.OPENAI_API_KEY:
            return "AI 서비스가 준비되지 않았습니다. 관리자에게 문의해주세요."

        mode_raw = ai_mode.lower() if ai_mode else "mom"
        mode = "nutrition" if mode_raw in ("nutrition", "nutritionist", "nutrient", "nutri") else mode_raw
        language_code = _safe_lang_detect(message)

        diary_builder = DiaryContextBuilder(kid, db)
        kid_snapshot = diary_builder.kid_snapshot(language_code)
        latest_record = diary_builder.latest_record()
        recent_digest = diary_builder.recent_digest(days=7)

        tools = self._build_tools(mode, kid, db, diary_builder)
        try:
            executor = self._build_agent_executor(
                mode=mode,
                language_code=language_code,
                kid_snapshot=kid_snapshot,
                latest_record=latest_record,
                recent_digest=recent_digest,
                tools=tools,
            )
            history_messages = self._to_history_messages(conversation_history)
            result = await asyncio.to_thread(
                executor.invoke, {"input": message, "chat_history": history_messages}
            )
            # AgentExecutor returns {"output": "..."}
            if isinstance(result, dict):
                return result.get("output") or "답변을 생성하지 못했습니다."
            return str(result)
        except Exception as exc:
            return f"답변 생성 중 오류가 발생했습니다: {exc}"


# Singleton instance
ai_service = AIService()
