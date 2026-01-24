from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, get_current_user
from app.crud import user as user_crud
from app.schemas.user import UserCreate, UserResponse, Token, RefreshTokenRequest
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 중복 검사
    if user_crud.get_user_by_username(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자명입니다"
        )
    if user_in.email and user_crud.get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다"
        )

    user = user_crud.create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """로그인"""
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 토큰 생성
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # 리프레시 토큰 저장
    user_crud.create_refresh_token(db, user.id, refresh_token)

    # 첫 로그인 여부 확인 후 응답
    is_first = user.is_first_login

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        is_first_login=is_first
    )


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """토큰 갱신"""
    # 리프레시 토큰 검증
    payload = decode_token(token_request.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 리프레시 토큰입니다"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 리프레시 토큰입니다"
        )

    # DB에서 리프레시 토큰 확인
    stored_token = user_crud.get_refresh_token(db, token_request.refresh_token)
    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="리프레시 토큰이 만료되었거나 존재하지 않습니다"
        )

    # 기존 토큰 삭제
    user_crud.delete_refresh_token(db, token_request.refresh_token)

    # 새 토큰 생성
    access_token = create_access_token(data={"sub": user_id})
    new_refresh_token = create_refresh_token(data={"sub": user_id})

    # 새 리프레시 토큰 저장
    user_crud.create_refresh_token(db, int(user_id), new_refresh_token)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """로그아웃 (모든 리프레시 토큰 삭제)"""
    user_crud.delete_user_refresh_tokens(db, current_user.id)
    return {"message": "로그아웃 되었습니다"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """현재 로그인된 사용자 정보"""
    return current_user


@router.post("/complete-onboarding")
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """온보딩 완료 (is_first_login을 False로 변경)"""
    user_crud.update_first_login_status(db, current_user)
    return {"message": "온보딩이 완료되었습니다"}
