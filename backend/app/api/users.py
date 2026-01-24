from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import user as user_crud
from app.crud import kid as kid_crud
from app.crud import record as record_crud
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.models.user import User

router = APIRouter(prefix="/users", tags=["사용자"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 수정"""
    # 이메일 중복 검사
    if user_in.email and user_in.email != current_user.email:
        if user_crud.get_user_by_email(db, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 이메일입니다"
            )

    user = user_crud.update_user(db, current_user, user_in)
    return user


@router.post("/me/password")
def change_password(
    password_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """비밀번호 변경"""
    # 현재 비밀번호 확인
    if not user_crud.verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다"
        )

    user_crud.update_password(db, current_user, password_in.new_password)
    return {"message": "비밀번호가 변경되었습니다"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """회원 탈퇴"""
    user_crud.delete_user(db, current_user)
    return None


@router.get("/me/home-data")
def get_home_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """홈 화면용 데이터 조회 (첫 번째 아이 정보 및 최근 기록)"""
    kids = kid_crud.get_kids_by_user(db, current_user.id)

    if not kids:
        return {
            "kid": None,
            "recent_record": None
        }

    first_kid = kids[0]
    recent_record = record_crud.get_latest_record_by_kid(db, first_kid.id)

    kid_data = {
        "id": first_kid.id,
        "name": first_kid.name,
        "birthday": first_kid.birth_date.isoformat() if first_kid.birth_date else None,
        "gender": first_kid.gender.value if first_kid.gender else None,
        "profile_image_url": first_kid.profile_image_url,
    }

    record_data = None
    if recent_record:
        record_data = {
            "id": recent_record.id,
            "record_type": recent_record.record_type.value,
            "record_date": recent_record.record_date.isoformat(),
            "created_at": recent_record.created_at.isoformat() if recent_record.created_at else None,
            "memo": recent_record.memo,
        }
        # 타입별 상세 정보 추가
        if recent_record.meal_record:
            mr = recent_record.meal_record
            record_data.update({
                "meal_type": mr.meal_type.value if mr.meal_type else None,
                "amount_ml": mr.amount_ml,
                "amount_text": mr.amount_text,
            })
        if recent_record.sleep_record:
            sr = recent_record.sleep_record
            record_data.update({
                "sleep_type": sr.sleep_type.value if sr.sleep_type else None,
                "duration_hours": sr.duration_hours,
            })
        if recent_record.diaper_record:
            dr = recent_record.diaper_record
            record_data.update({
                "diaper_type": dr.diaper_type.value if dr.diaper_type else None,
            })

    return {
        "kid": kid_data,
        "recent_record": record_data
    }
