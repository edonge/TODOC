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
        kid = db.query(Kid).get(req.kid_id) if req.kid_id else None

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

        reply = await generate_response(
            message=req.message,
            mode=req.mode,
            history=req.history,
            kid=kid,
            db=db,
        )
        # 세션/메시지 저장 (없으면 생성)
        from datetime import datetime

        session = None
        if req.session_id:
            session = db.query(ChatSession).get(req.session_id)
        if session is None:
            title_text = await _summarize_title(req.message, req.mode)
            session = ChatSession(
                mode=req.mode,
                kid_id=req.kid_id,
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

        return {
            "reply": reply,
            "session_id": session.id,
            "mode": req.mode,
            "date_label": session.date_label or datetime.utcnow().strftime("%m.%d"),
            "title": session.title,
            "question_snippet": session.question_snippet,
        }

    return app


app = create_app()
