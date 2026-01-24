from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import kid as kid_crud
from app.schemas.kid import KidCreate, KidUpdate, KidResponse, KidListResponse
from app.models.user import User

router = APIRouter(prefix="/kids", tags=["아이"])


@router.get("", response_model=KidListResponse)
def get_kids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """아이 목록 조회"""
    kids = kid_crud.get_kids_by_user(db, current_user.id)
    return KidListResponse(
        kids=[KidResponse.from_orm(kid) for kid in kids],
        total=len(kids)
    )


@router.post("", response_model=KidResponse, status_code=status.HTTP_201_CREATED)
def create_kid(
    kid_in: KidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """아이 등록"""
    kid = kid_crud.create_kid(db, current_user.id, kid_in)
    return kid


@router.get("/{kid_id}", response_model=KidResponse)
def get_kid(
    kid_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """아이 상세 조회"""
    kid = kid_crud.get_kid_by_user(db, kid_id, current_user.id)
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이를 찾을 수 없습니다"
        )
    return kid


@router.patch("/{kid_id}", response_model=KidResponse)
def update_kid(
    kid_id: int,
    kid_in: KidUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """아이 정보 수정"""
    kid = kid_crud.get_kid_by_user(db, kid_id, current_user.id)
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이를 찾을 수 없습니다"
        )

    kid = kid_crud.update_kid(db, kid, kid_in)
    return kid


@router.delete("/{kid_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kid(
    kid_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """아이 삭제"""
    kid = kid_crud.get_kid_by_user(db, kid_id, current_user.id)
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이를 찾을 수 없습니다"
        )

    kid_crud.delete_kid(db, kid)
    return None
