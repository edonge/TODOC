from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


# =============================================================================
# User Create / Login
# =============================================================================
class UserCreate(BaseModel):
    """회원가입"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="사용자명 (3~50자)"
    )
    email: Optional[EmailStr] = Field(None, description="이메일 (선택)")
    password: str = Field(
        ...,
        min_length=6,
        description="비밀번호 (최소 6자)"
    )


class UserLogin(BaseModel):
    """로그인"""
    username: str = Field(..., description="사용자명")
    password: str = Field(..., description="비밀번호")


# =============================================================================
# User Update
# =============================================================================
class UserUpdate(BaseModel):
    """사용자 정보 수정"""
    nickname: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="닉네임"
    )
    email: Optional[EmailStr] = Field(None, description="이메일")
    profile_image_url: Optional[str] = Field(None, description="프로필 이미지 URL")


class PasswordChange(BaseModel):
    """비밀번호 변경"""
    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(
        ...,
        min_length=6,
        description="새 비밀번호 (최소 6자)"
    )


# =============================================================================
# User Response
# =============================================================================
class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: int
    username: str
    nickname: Optional[str] = None
    email: Optional[str] = None
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserBriefResponse(BaseModel):
    """사용자 간략 정보 (커뮤니티 등에서 사용)"""
    id: int
    username: str
    nickname: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True


# =============================================================================
# Token
# =============================================================================
class Token(BaseModel):
    """JWT 토큰"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """토큰 페이로드 데이터"""
    user_id: Optional[int] = None
    username: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """토큰 갱신 요청"""
    refresh_token: str = Field(..., description="리프레시 토큰")
