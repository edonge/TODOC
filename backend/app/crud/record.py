from datetime import date, datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import select, and_
from sqlalchemy.orm import Session, joinedload

from app.models.record import (
    Record, SleepRecord, GrowthRecord, MealRecord,
    HealthRecord, DiaperRecord, EtcRecord
)
from app.models.enums import RecordTypeEnum


# =============================================================================
# Record (기본 기록) CRUD
# =============================================================================
def get_record(db: Session, record_id: int) -> Optional[Record]:
    """기록 조회 (ID)"""
    return db.get(Record, record_id)


def get_record_with_details(db: Session, record_id: int) -> Optional[Record]:
    """기록 조회 (상세 정보 포함)"""
    stmt = (
        select(Record)
        .options(
            joinedload(Record.sleep_record),
            joinedload(Record.growth_record),
            joinedload(Record.meal_record),
            joinedload(Record.health_record),
            joinedload(Record.diaper_record),
            joinedload(Record.etc_record),
        )
        .where(Record.id == record_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_records_by_kid(
    db: Session,
    kid_id: int,
    record_type: Optional[RecordTypeEnum] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Record]:
    """아이의 기록 목록 조회"""
    stmt = (
        select(Record)
        .options(
            joinedload(Record.sleep_record),
            joinedload(Record.growth_record),
            joinedload(Record.meal_record),
            joinedload(Record.health_record),
            joinedload(Record.diaper_record),
            joinedload(Record.etc_record),
        )
        .where(Record.kid_id == kid_id)
    )

    if record_type:
        stmt = stmt.where(Record.record_type == record_type)
    if start_date:
        stmt = stmt.where(Record.record_date >= start_date)
    if end_date:
        stmt = stmt.where(Record.record_date <= end_date)

    stmt = stmt.order_by(Record.record_date.desc(), Record.created_at.desc())
    stmt = stmt.offset(skip).limit(limit)

    return list(db.execute(stmt).unique().scalars().all())


def get_records_by_date(db: Session, kid_id: int, record_date: date) -> List[Record]:
    """특정 날짜의 기록 조회"""
    stmt = (
        select(Record)
        .options(
            joinedload(Record.sleep_record),
            joinedload(Record.growth_record),
            joinedload(Record.meal_record),
            joinedload(Record.health_record),
            joinedload(Record.diaper_record),
            joinedload(Record.etc_record),
        )
        .where(and_(Record.kid_id == kid_id, Record.record_date == record_date))
        .order_by(Record.created_at.desc())
    )
    return list(db.execute(stmt).unique().scalars().all())


def count_records_by_kid(
    db: Session,
    kid_id: int,
    record_type: Optional[RecordTypeEnum] = None
) -> int:
    """아이의 기록 수"""
    stmt = select(Record).where(Record.kid_id == kid_id)
    if record_type:
        stmt = stmt.where(Record.record_type == record_type)
    return len(list(db.execute(stmt).scalars().all()))


def delete_record(db: Session, record: Record) -> None:
    """기록 삭제"""
    db.delete(record)
    db.commit()


def get_latest_record_by_kid(db: Session, kid_id: int) -> Optional[Record]:
    """아이의 가장 최근 기록 조회"""
    stmt = (
        select(Record)
        .options(
            joinedload(Record.sleep_record),
            joinedload(Record.growth_record),
            joinedload(Record.meal_record),
            joinedload(Record.health_record),
            joinedload(Record.diaper_record),
            joinedload(Record.etc_record),
        )
        .where(Record.kid_id == kid_id)
        .order_by(Record.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


# =============================================================================
# Sleep Record CRUD
# =============================================================================
def create_sleep_record(
    db: Session,
    kid_id: int,
    record_date: date,
    sleep_type: str,
    start_datetime: datetime,
    end_datetime: datetime,
    sleep_quality: Optional[str] = None,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """수면 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.SLEEP,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    sleep_record = SleepRecord(
        record_id=record.id,
        sleep_type=sleep_type,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        sleep_quality=sleep_quality,
    )
    db.add(sleep_record)
    db.commit()
    db.refresh(record)
    return record


def update_sleep_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """수면 기록 수정"""
    # 기본 기록 업데이트
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    # 수면 기록 업데이트
    if record.sleep_record:
        for field in ["sleep_type", "start_datetime", "end_datetime", "sleep_quality"]:
            if field in data and data[field] is not None:
                setattr(record.sleep_record, field, data[field])

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Growth Record CRUD
# =============================================================================
def create_growth_record(
    db: Session,
    kid_id: int,
    record_date: date,
    height_cm: Optional[float] = None,
    weight_kg: Optional[float] = None,
    head_circumference_cm: Optional[float] = None,
    activities: Optional[List[str]] = None,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """성장 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.GROWTH,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    growth_record = GrowthRecord(
        record_id=record.id,
        height_cm=height_cm,
        weight_kg=weight_kg,
        head_circumference_cm=head_circumference_cm,
        activities=activities,
    )
    db.add(growth_record)
    db.commit()
    db.refresh(record)
    return record


def update_growth_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """성장 기록 수정"""
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if record.growth_record:
        for field in ["height_cm", "weight_kg", "head_circumference_cm", "activities"]:
            if field in data:
                setattr(record.growth_record, field, data[field])

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Meal Record CRUD
# =============================================================================
def create_meal_record(
    db: Session,
    kid_id: int,
    record_date: date,
    meal_datetime: datetime,
    meal_type: str,
    unknown_time: bool = False,
    duration_minutes: Optional[int] = None,
    meal_detail: Optional[str] = None,
    amount_ml: Optional[int] = None,
    amount_text: Optional[str] = None,
    burp: bool = False,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """식사 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.MEAL,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    meal_record = MealRecord(
        record_id=record.id,
        meal_datetime=meal_datetime,
        unknown_time=unknown_time,
        duration_minutes=duration_minutes,
        meal_type=meal_type,
        meal_detail=meal_detail,
        amount_ml=amount_ml,
        amount_text=amount_text,
        burp=burp,
    )
    db.add(meal_record)
    db.commit()
    db.refresh(record)
    return record


def update_meal_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """식사 기록 수정"""
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if record.meal_record:
        for field in ["meal_datetime", "unknown_time", "duration_minutes", "meal_type",
                      "meal_detail", "amount_ml", "amount_text", "burp"]:
            if field in data:
                setattr(record.meal_record, field, data[field])

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Health Record CRUD
# =============================================================================
def create_health_record(
    db: Session,
    kid_id: int,
    record_date: date,
    health_datetime: datetime,
    title: str,
    unknown_time: bool = False,
    symptoms: Optional[List[str]] = None,
    medicines: Optional[List[str]] = None,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """건강 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.HEALTH,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    health_record = HealthRecord(
        record_id=record.id,
        health_datetime=health_datetime,
        unknown_time=unknown_time,
        title=title,
        symptoms=symptoms,
        medicines=medicines,
    )
    db.add(health_record)
    db.commit()
    db.refresh(record)
    return record


def update_health_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """건강 기록 수정"""
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if record.health_record:
        for field in ["health_datetime", "unknown_time", "title", "symptoms", "medicines"]:
            if field in data:
                setattr(record.health_record, field, data[field])

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Diaper Record CRUD
# =============================================================================
def create_diaper_record(
    db: Session,
    kid_id: int,
    record_date: date,
    diaper_datetime: datetime,
    diaper_type: str,
    unknown_time: bool = False,
    amount: Optional[str] = None,
    condition: Optional[str] = None,
    color: Optional[str] = None,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """배변 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.DIAPER,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    diaper_record = DiaperRecord(
        record_id=record.id,
        diaper_datetime=diaper_datetime,
        unknown_time=unknown_time,
        diaper_type=diaper_type,
        amount=amount,
        condition=condition,
        color=color,
    )
    db.add(diaper_record)
    db.commit()
    db.refresh(record)
    return record


def update_diaper_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """배변 기록 수정"""
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if record.diaper_record:
        for field in ["diaper_datetime", "unknown_time", "diaper_type", "amount", "condition", "color"]:
            if field in data:
                setattr(record.diaper_record, field, data[field])

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Etc Record CRUD
# =============================================================================
def create_etc_record(
    db: Session,
    kid_id: int,
    record_date: date,
    title: str,
    memo: Optional[str] = None,
    image_url: Optional[str] = None
) -> Record:
    """기타 기록 생성"""
    record = Record(
        kid_id=kid_id,
        record_type=RecordTypeEnum.ETC,
        record_date=record_date,
        memo=memo,
        image_url=image_url,
    )
    db.add(record)
    db.flush()

    etc_record = EtcRecord(
        record_id=record.id,
        title=title,
    )
    db.add(etc_record)
    db.commit()
    db.refresh(record)
    return record


def update_etc_record(
    db: Session,
    record: Record,
    data: Dict[str, Any]
) -> Record:
    """기타 기록 수정"""
    for field in ["record_date", "memo", "image_url"]:
        if field in data and data[field] is not None:
            setattr(record, field, data[field])

    if record.etc_record:
        if "title" in data:
            record.etc_record.title = data["title"]

    db.commit()
    db.refresh(record)
    return record


# =============================================================================
# Monthly Records Summary (캘린더용)
# =============================================================================
def get_monthly_record_dates(
    db: Session,
    kid_id: int,
    year: int,
    month: int
) -> Dict[str, bool]:
    """
    월별 기록 날짜 조회 (캘린더 표시용)
    각 날짜에 기록이 있는지 여부를 반환
    """
    from calendar import monthrange

    _, days_in_month = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, days_in_month)

    stmt = (
        select(Record.record_date)
        .where(
            and_(
                Record.kid_id == kid_id,
                Record.record_date >= start_date,
                Record.record_date <= end_date
            )
        )
        .distinct()
    )
    recorded_dates = {row[0] for row in db.execute(stmt).all()}

    result = {}
    for day in range(1, days_in_month + 1):
        d = date(year, month, day)
        date_str = d.isoformat()
        result[date_str] = d in recorded_dates

    return result
