import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import kid as kid_crud
from app.models.user import User
from app.stt.service import process_speech_to_record

logger = logging.getLogger("todoc.stt")

router = APIRouter(prefix="/speech", tags=["음성 기록"])

MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB

SUFFIX_MAP = {
    "audio/webm": ".webm",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
}


@router.post("/transcribe/{kid_id}")
async def transcribe_speech(
    kid_id: int,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """음성 파일을 받아 전사 + 구조화된 기록 데이터를 반환합니다 (DB 저장 없음)."""
    # Validate kid ownership
    kid = kid_crud.get_kid_by_user(db, kid_id, current_user.id)
    if not kid:
        raise HTTPException(status_code=404, detail="아이를 찾을 수 없습니다")

    # Read and validate audio
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=413, detail="오디오 파일이 너무 큽니다 (최대 10MB)"
        )

    suffix = SUFFIX_MAP.get(audio.content_type, ".webm")

    try:
        result = await process_speech_to_record(audio_bytes, suffix)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"음성 처리 실패: {str(e)}")
    except Exception:
        logger.exception("Speech-to-record pipeline failed")
        raise HTTPException(
            status_code=500, detail="음성 처리 중 오류가 발생했습니다"
        )

    return {
        "transcript": result["transcript"],
        "records": result["records"],
    }
