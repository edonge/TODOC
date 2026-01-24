from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.user import User, RefreshToken
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """비밀번호 해시"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# User CRUD
# =============================================================================
def get_user(db: Session, user_id: int) -> Optional[User]:
    """사용자 조회 (ID)"""
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """사용자 조회 (username)"""
    stmt = select(User).where(User.username == username)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """사용자 조회 (email)"""
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """사용자 목록 조회"""
    stmt = select(User).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars().all())


def create_user(db: Session, user_in: UserCreate) -> User:
    """사용자 생성"""
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, user_in: UserUpdate) -> User:
    """사용자 정보 수정"""
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, new_password: str) -> User:
    """비밀번호 변경"""
    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    """사용자 삭제"""
    db.delete(user)
    db.commit()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """사용자 인증"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_first_login_status(db: Session, user: User) -> User:
    """첫 로그인 상태 업데이트 (is_first_login을 False로 변경)"""
    user.is_first_login = False
    db.commit()
    db.refresh(user)
    return user


# =============================================================================
# RefreshToken CRUD
# =============================================================================
def create_refresh_token(
    db: Session,
    user_id: int,
    token: str,
    expires_delta: timedelta = timedelta(days=7)
) -> RefreshToken:
    """리프레시 토큰 생성"""
    refresh_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + expires_delta,
    )
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    return refresh_token


def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """리프레시 토큰 조회"""
    stmt = select(RefreshToken).where(RefreshToken.token == token)
    return db.execute(stmt).scalar_one_or_none()


def delete_refresh_token(db: Session, token: str) -> None:
    """리프레시 토큰 삭제"""
    refresh_token = get_refresh_token(db, token)
    if refresh_token:
        db.delete(refresh_token)
        db.commit()


def delete_user_refresh_tokens(db: Session, user_id: int) -> None:
    """사용자의 모든 리프레시 토큰 삭제"""
    stmt = select(RefreshToken).where(RefreshToken.user_id == user_id)
    tokens = db.execute(stmt).scalars().all()
    for token in tokens:
        db.delete(token)
    db.commit()
