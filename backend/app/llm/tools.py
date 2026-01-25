import requests
from langchain_core.tools import Tool
from typing import Optional

from .vector_loader import load_mode_stores
from app.core.config import settings


def build_rag_tool(mode: str):
    retriever = load_mode_stores(
        settings.vector_base_dir, settings.mode_vector_dirs.get(mode, ["mom_docs", "common_docs"])
    )

    def _rag(q: str) -> str:
        if not retriever:
            return "Vector DB unavailable."
        docs = retriever.invoke(q)
        formatted = []
        for d in docs:
            source = d.metadata.get("source") if hasattr(d, "metadata") else None
            formatted.append(f"[{source or 'doc'}] {d.page_content}")
        return "RAG_SNIPPETS:\n" + "\n\n".join(formatted) if formatted else "No RAG hits."

    return Tool.from_function(
        name="rag_search",
        func=_rag,
        description=f"{mode} 전용+공통 문서를 검색해 스니펫을 반환",
    )


def build_diary_tools(diary_builder):
    def recent(_: str = "") -> str:
        return diary_builder.recent_digest()

    def latest(_: str = "") -> str:
        return diary_builder.latest_record()

    return [
        Tool.from_function(name="diary_recent", func=recent, description="최근 7일 일지 요약"),
        Tool.from_function(name="diary_latest", func=latest, description="가장 최근 일지 1건"),
    ]


def build_web_tool():
    def web_search(q: str) -> str:
        try:
            resp = requests.get(
                "https://api.duckduckgo.com/",
                params={"q": q, "format": "json", "no_html": 1},
                timeout=6,
            )
            resp.raise_for_status()
            data = resp.json()
            lines = []
            if data.get("AbstractText"):
                lines.append(data["AbstractText"][:320])
            for topic in data.get("RelatedTopics", [])[:3]:
                text = topic.get("Text")
                if text:
                    lines.append(text[:320])
            return "\n".join(lines) or "No snippets."
        except Exception as exc:
            return f"Web search failed: {exc}"

    return Tool.from_function(
        name="web_search",
        func=web_search,
        description="영양/레시피 질문 시 보조용 웹검색(duckduckgo)",
    )
