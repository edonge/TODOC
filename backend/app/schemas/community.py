from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

from app.models.enums import CommunityCategoryEnum
from app.schemas.user import UserBriefResponse


# =============================================================================
# Post Create / Update
# =============================================================================
class PostCreate(BaseModel):
    """게시글 작성"""
    kid_id: Optional[int] = Field(None, description="아이 ID (선택)")
    category: CommunityCategoryEnum = Field(..., description="카테고리")
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="제목"
    )
    content: str = Field(
        ...,
        min_length=1,
        description="내용"
    )
    image_url: Optional[str] = Field(None, description="이미지 URL")


class PostUpdate(BaseModel):
    """게시글 수정"""
    category: Optional[CommunityCategoryEnum] = Field(None, description="카테고리")
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="제목"
    )
    content: Optional[str] = Field(
        None,
        min_length=1,
        description="내용"
    )
    image_url: Optional[str] = Field(None, description="이미지 URL")


# =============================================================================
# Post Response
# =============================================================================
class PostResponse(BaseModel):
    """게시글 응답"""
    id: int
    user_id: int
    kid_id: Optional[int] = None
    category: CommunityCategoryEnum
    title: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    likes_count: int = 0
    comment_count: int = 0
    is_liked: bool = Field(False, description="현재 사용자의 좋아요 여부")
    author: Optional[UserBriefResponse] = None
    kid_name: Optional[str] = Field(None, description="아이 이름")
    kid_image_url: Optional[str] = Field(None, description="아이 프로필 이미지")

    class Config:
        from_attributes = True


class PostBriefResponse(BaseModel):
    """게시글 간략 응답 (목록용)"""
    id: int
    category: CommunityCategoryEnum
    title: str
    content: str = Field(..., description="내용 미리보기 (일부)")
    created_at: datetime
    likes_count: int = 0
    comment_count: int = 0
    author: Optional[UserBriefResponse] = None
    kid_name: Optional[str] = Field(None, description="아이 이름")
    kid_image_url: Optional[str] = Field(None, description="아이 프로필 이미지")

    class Config:
        from_attributes = True


# =============================================================================
# Post List Response
# =============================================================================
class PostListResponse(BaseModel):
    """게시글 목록 응답"""
    posts: List[PostBriefResponse]
    total: int
    page: int
    limit: int
    has_next: bool = Field(..., description="다음 페이지 존재 여부")


# =============================================================================
# Comment Create / Update
# =============================================================================
class CommentCreate(BaseModel):
    """댓글 작성"""
    content: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="댓글 내용"
    )
    parent_id: Optional[int] = Field(None, description="부모 댓글 ID (대댓글용)")


class CommentUpdate(BaseModel):
    """댓글 수정"""
    content: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="댓글 내용"
    )


# =============================================================================
# Comment Response
# =============================================================================
class CommentResponse(BaseModel):
    """댓글 응답"""
    id: int
    post_id: int
    user_id: int
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[UserBriefResponse] = None
    replies: Optional[List["CommentResponse"]] = Field(None, description="대댓글 목록")
    likes_count: int = 0
    is_liked: bool = False

    class Config:
        from_attributes = True


# =============================================================================
# Comment List Response
# =============================================================================
class CommentListResponse(BaseModel):
    """댓글 목록 응답"""
    comments: List[CommentResponse]
    total: int


# =============================================================================
# Like Response
# =============================================================================
class LikeResponse(BaseModel):
    """좋아요 응답"""
    is_liked: bool
    likes_count: int


# =============================================================================
# Search / Filter
# =============================================================================
class PostSearchParams(BaseModel):
    """게시글 검색 파라미터"""
    keyword: Optional[str] = Field(None, min_length=2, description="검색어")
    category: Optional[CommunityCategoryEnum] = Field(None, description="카테고리 필터")
    author_id: Optional[int] = Field(None, description="작성자 필터")
    page: int = Field(1, ge=1, description="페이지 번호")
    limit: int = Field(20, ge=1, le=100, description="페이지당 항목 수")
    sort_by: str = Field("created_at", description="정렬 기준")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="정렬 방향")
