from datetime import date
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.kid import Kid
from app.schemas.kid import KidCreate, KidUpdate


def get_kid(db: Session, kid_id: int) -> Optional[Kid]:
    """아이 조회 (ID)"""
    return db.get(Kid, kid_id)


def get_kid_by_user(db: Session, kid_id: int, user_id: int) -> Optional[Kid]:
    """사용자의 아이 조회"""
    stmt = select(Kid).where(Kid.id == kid_id, Kid.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def get_kids_by_user(db: Session, user_id: int) -> List[Kid]:
    """사용자의 아이 목록 조회"""
    stmt = select(Kid).where(Kid.user_id == user_id).order_by(Kid.birth_date.desc())
    return list(db.execute(stmt).scalars().all())


def create_kid(db: Session, user_id: int, kid_in: KidCreate) -> Kid:
    """아이 등록"""
    kid = Kid(
        user_id=user_id,
        name=kid_in.name,
        birth_date=kid_in.birth_date,
        gender=kid_in.gender,
        profile_image_url=kid_in.profile_image_url,
    )
    db.add(kid)
    db.commit()
    db.refresh(kid)
    return kid


def update_kid(db: Session, kid: Kid, kid_in: KidUpdate) -> Kid:
    """아이 정보 수정"""
    update_data = kid_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(kid, field, value)
    db.commit()
    db.refresh(kid)
    return kid


def delete_kid(db: Session, kid: Kid) -> None:
    """아이 삭제"""
    db.delete(kid)
    db.commit()


def count_kids_by_user(db: Session, user_id: int) -> int:
    """사용자의 아이 수"""
    stmt = select(Kid).where(Kid.user_id == user_id)
    return len(list(db.execute(stmt).scalars().all()))
