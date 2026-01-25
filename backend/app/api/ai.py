from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import ChatSession, ChatMessage, User
from app.schemas.chat import ChatMessage as ChatMessageSchema, ChatSessionSummary

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/sessions", response_model=List[ChatSessionSummary])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return [
        ChatSessionSummary(
            id=s.id,
            title=s.title or "새 대화",
            question_snippet=s.question_snippet or "",
            date_label=s.date_label or "",
            mode=s.mode,
            kid_id=s.kid_id,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="세션을 찾을 수 없습니다")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "session": ChatSessionSummary(
            id=session.id,
            title=session.title or "새 대화",
            question_snippet=session.question_snippet or "",
            date_label=session.date_label or "",
            mode=session.mode,
            kid_id=session.kid_id,
        ),
        "messages": [
            ChatMessageSchema(
                id=m.id,
                session_id=m.session_id,
                sender=m.sender,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    }
