from typing import List

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import api_router
from app.llm.service import generate_response
from app.schemas import ChatRequest, ChatResponse

# TODO: DB 세션 연결 시 사용
def get_db():
    return None


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
    async def ai_chat(req: ChatRequest, db=Depends(get_db)):
        # DB 연결/아이 선택은 추후 주입 (현재 None).
        reply = await generate_response(
            message=req.message,
            mode=req.mode,
            history=req.history,
            kid=None,
            db=None,
        )
        # 임시 session_id/date_label/title 생성 (DB 도입 후 교체)
        from datetime import datetime

        session_id = req.session_id or int(datetime.utcnow().timestamp())
        date_label = datetime.utcnow().strftime("%m.%d")
        return {
            "reply": reply,
            "session_id": session_id,
            "mode": req.mode,
            "date_label": date_label,
            "title": req.message[:32],
            "question_snippet": req.message[:80],
        }

    return app


app = create_app()
