from typing import List

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api import api_router
from app.llm.service import generate_response
from app.schemas import ChatRequest, ChatResponse
from app.core.database import get_db
from app.models import Kid, ChatSession, ChatMessage
from app.llm.agent import build_llm


def get_cors_origins() -> List[str]:
    """CORS 허용 origin 목록 생성"""
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://todoc.ai.kr",
        "https://www.todoc.ai.kr",
    ]

    # 환경변수 FRONTEND_ORIGIN이 있으면 추가
    if settings.frontend_origin and settings.frontend_origin not in origins:
        origins.append(settings.frontend_origin)

    return origins


def create_app() -> FastAPI:
    app = FastAPI(
        title="Todoc API",
        version="0.1.0",
        description="육아 기록 및 커뮤니티 API"
    )

    # CORS 설정 - 배포/개발 환경 모두 지원
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,  # preflight 캐시 10분
    )

    # API 라우터 등록
    app.include_router(api_router)

    @app.get("/health")
    def health_check() -> dict:
        return {"status": "ok"}

    @app.post("/api/ai/chat", response_model=ChatResponse)
    async def ai_chat(req: ChatRequest, db: Session = Depends(get_db)):
        # kid_id가 주어지지 않았거나 잘못된 경우에도 반드시 가장 최근 등록된 아이 정보를 사용
        kid = None
        if req.kid_id:
            kid = db.query(Kid).get(req.kid_id)
        if kid is None:
            kid = db.query(Kid).order_by(Kid.created_at.desc()).first()

        async def _summarize_title(msg: str, mode: str) -> str:
            """LLM으로 주제 한 줄(<=20자) 요약."""
            try:
                llm = build_llm()
                prompt = (
                    "다음 사용자의 질문을 20자 이하의 간단한 주제 한글 명사구로 요약하세요.\n"
                    f"[모드: {mode}]\n"
                    f"[질문]: {msg}"
                )
                res = await llm.ainvoke(prompt)
                text = res.content if hasattr(res, "content") else str(res)
                return (text or "").strip()[:40]
            except Exception:
                return msg[:32]

        response_data = await generate_response(
            message=req.message,
            mode=req.mode,
            history=req.history,
            kid=kid,
            db=db,
        )

        reply = response_data["output"]
        tools_called = response_data.get("tools_called", [])
        rag_used = response_data.get("rag_used", False)
        kid_info_used = response_data.get("kid_info_used", False)

        # 세션/메시지 저장 (없으면 생성)
        from datetime import datetime

        session = None
        if req.session_id:
            session = db.query(ChatSession).get(req.session_id)
        if session is None:
            title_text = await _summarize_title(req.message, req.mode)
            session = ChatSession(
                mode=req.mode,
                kid_id=(kid.id if kid else req.kid_id),
                title=title_text,
                question_snippet=req.message[:80],
                date_label=datetime.utcnow().strftime("%m.%d"),
            )
            db.add(session)
            db.flush()  # session.id 확보

        # 메시지 기록 (user, ai)
        db.add_all(
            [
                ChatMessage(session_id=session.id, sender="user", content=req.message),
                ChatMessage(session_id=session.id, sender="ai", content=reply),
            ]
        )
        session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session)

        # RAG 참조 문서 추출 (📚 참고: [문서명] 패턴)
        import re
        references = []
        ref_pattern = r'📚\s*참고:\s*\[([^\]]+)\]'
        matches = re.findall(ref_pattern, reply)
        if matches:
            references = list(set(matches))  # 중복 제거

        return {
            "reply": reply,
            "session_id": session.id,
            "mode": req.mode,
            "date_label": session.date_label or datetime.utcnow().strftime("%m.%d"),
            "title": session.title,
            "question_snippet": session.question_snippet,
            "kid_id": kid.id if kid else None,
            "kid_name": kid.name if kid else None,
            "references": references if references else None,
            # 디버그 정보 (개발 중에만 사용, 나중에 제거 가능)
            "_debug": {
                "tools_called": tools_called,
                "rag_used": rag_used,
                "kid_info_used": kid_info_used,
            }
        }

    return app


app = create_app()
