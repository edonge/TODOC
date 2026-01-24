from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import kid as kid_crud
from app.crud import record as record_crud
from app.models.user import User
from app.models.enums import RecordTypeEnum
from app.schemas.record import (
    SleepRecordCreate, GrowthRecordCreate, MealRecordCreate,
    HealthRecordCreate, DiaperRecordCreate, EtcRecordCreate,
    RecordListResponse, RecordWithDetailsResponse, DailySummaryResponse
)

router = APIRouter(prefix="/kids/{kid_id}/records", tags=["기록"])


def get_kid_or_404(db: Session, kid_id: int, user_id: int):
    """아이 조회 (없으면 404)"""
    kid = kid_crud.get_kid_by_user(db, kid_id, user_id)
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이를 찾을 수 없습니다"
        )
    return kid


# =============================================================================
# 기록 목록/조회
# =============================================================================
@router.get("", response_model=RecordListResponse)
def get_records(
    kid_id: int,
    record_type: Optional[RecordTypeEnum] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """기록 목록 조회"""
    get_kid_or_404(db, kid_id, current_user.id)

    skip = (page - 1) * limit
    records = record_crud.get_records_by_kid(
        db, kid_id,
        record_type=record_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    total = record_crud.count_records_by_kid(db, kid_id, record_type)

    return RecordListResponse(
        records=[_record_to_response(r) for r in records],
        total=total,
        page=page,
        limit=limit
    )


@router.get("/date/{record_date}")
def get_records_by_date(
    kid_id: int,
    record_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 날짜의 기록 조회"""
    get_kid_or_404(db, kid_id, current_user.id)

    records = record_crud.get_records_by_date(db, kid_id, record_date)
    return {
        "date": record_date,
        "records": [_record_to_response(r) for r in records]
    }


@router.get("/{record_id}", response_model=RecordWithDetailsResponse)
def get_record(
    kid_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """기록 상세 조회"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.get_record_with_details(db, record_id)
    if not record or record.kid_id != kid_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="기록을 찾을 수 없습니다"
        )

    return _record_to_response(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    kid_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """기록 삭제"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.get_record(db, record_id)
    if not record or record.kid_id != kid_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="기록을 찾을 수 없습니다"
        )

    record_crud.delete_record(db, record)
    return None


# =============================================================================
# 수면 기록
# =============================================================================
@router.post("/sleep", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_sleep_record(
    kid_id: int,
    record_in: SleepRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """수면 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_sleep_record(
        db, kid_id,
        record_date=record_in.record_date,
        sleep_type=record_in.sleep_type.value,
        start_datetime=record_in.start_datetime,
        end_datetime=record_in.end_datetime,
        sleep_quality=record_in.sleep_quality.value if record_in.sleep_quality else None,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# 성장 기록
# =============================================================================
@router.post("/growth", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_growth_record(
    kid_id: int,
    record_in: GrowthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """성장 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_growth_record(
        db, kid_id,
        record_date=record_in.record_date,
        height_cm=float(record_in.height_cm) if record_in.height_cm else None,
        weight_kg=float(record_in.weight_kg) if record_in.weight_kg else None,
        head_circumference_cm=float(record_in.head_circumference_cm) if record_in.head_circumference_cm else None,
        activities=[a.value for a in record_in.activities] if record_in.activities else None,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# 식사 기록
# =============================================================================
@router.post("/meal", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_meal_record(
    kid_id: int,
    record_in: MealRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """식사 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_meal_record(
        db, kid_id,
        record_date=record_in.record_date,
        meal_datetime=record_in.meal_datetime,
        meal_type=record_in.meal_type.value,
        unknown_time=record_in.unknown_time,
        duration_minutes=record_in.duration_minutes,
        meal_detail=record_in.meal_detail,
        amount_ml=record_in.amount_ml,
        amount_text=record_in.amount_text,
        burp=record_in.burp,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# 건강 기록
# =============================================================================
@router.post("/health", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_health_record(
    kid_id: int,
    record_in: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """건강 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_health_record(
        db, kid_id,
        record_date=record_in.record_date,
        health_datetime=record_in.health_datetime,
        title=record_in.title,
        unknown_time=record_in.unknown_time,
        symptoms=[s.value for s in record_in.symptoms] if record_in.symptoms else None,
        medicines=[m.value for m in record_in.medicines] if record_in.medicines else None,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# 배변 기록
# =============================================================================
@router.post("/diaper", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_diaper_record(
    kid_id: int,
    record_in: DiaperRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """배변 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_diaper_record(
        db, kid_id,
        record_date=record_in.record_date,
        diaper_datetime=record_in.diaper_datetime,
        diaper_type=record_in.diaper_type.value,
        unknown_time=record_in.unknown_time,
        amount=record_in.amount.value if record_in.amount else None,
        condition=record_in.condition.value if record_in.condition else None,
        color=record_in.color.value if record_in.color else None,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# 기타 기록
# =============================================================================
@router.post("/etc", response_model=RecordWithDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_etc_record(
    kid_id: int,
    record_in: EtcRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """기타 기록 생성"""
    get_kid_or_404(db, kid_id, current_user.id)

    record = record_crud.create_etc_record(
        db, kid_id,
        record_date=record_in.record_date,
        title=record_in.title,
        memo=record_in.memo,
        image_url=record_in.image_url
    )
    return _record_to_response(record)


# =============================================================================
# Helper
# =============================================================================
def _record_to_response(record) -> dict:
    """Record 모델을 응답 형태로 변환"""
    data = {
        "id": record.id,
        "kid_id": record.kid_id,
        "record_type": record.record_type,
        "record_date": record.record_date,
        "memo": record.memo,
        "image_url": record.image_url,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }

    # 타입별 상세 정보 추가
    if record.sleep_record:
        sr = record.sleep_record
        data.update({
            "sleep_type": sr.sleep_type,
            "start_datetime": sr.start_datetime,
            "end_datetime": sr.end_datetime,
            "sleep_quality": sr.sleep_quality,
            "duration_hours": sr.duration_hours,
        })

    if record.growth_record:
        gr = record.growth_record
        data.update({
            "height_cm": gr.height_cm,
            "weight_kg": gr.weight_kg,
            "head_circumference_cm": gr.head_circumference_cm,
            "activities": gr.activities,
        })

    if record.meal_record:
        mr = record.meal_record
        data.update({
            "meal_datetime": mr.meal_datetime,
            "unknown_time": mr.unknown_time,
            "duration_minutes": mr.duration_minutes,
            "meal_type": mr.meal_type,
            "meal_detail": mr.meal_detail,
            "amount_ml": mr.amount_ml,
            "amount_text": mr.amount_text,
            "burp": mr.burp,
        })

    if record.health_record:
        hr = record.health_record
        data.update({
            "health_datetime": hr.health_datetime,
            "unknown_time": hr.unknown_time,
            "title": hr.title,
            "symptoms": hr.symptoms,
            "medicines": hr.medicines,
        })

    if record.diaper_record:
        dr = record.diaper_record
        data.update({
            "diaper_datetime": dr.diaper_datetime,
            "unknown_time": dr.unknown_time,
            "diaper_type": dr.diaper_type,
            "amount": dr.amount,
            "condition": dr.condition,
            "color": dr.color,
        })

    if record.etc_record:
        er = record.etc_record
        data.update({
            "title": er.title,
        })

    return data
