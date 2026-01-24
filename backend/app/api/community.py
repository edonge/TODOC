from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.crud import community as community_crud
from app.models.user import User
from app.models.enums import CommunityCategoryEnum
from app.schemas.community import (
    PostCreate, PostUpdate, PostResponse, PostBriefResponse, PostListResponse,
    CommentCreate, CommentUpdate, CommentResponse, CommentListResponse,
    LikeResponse
)
from app.schemas.user import UserBriefResponse

router = APIRouter(prefix="/community", tags=["커뮤니티"])


# =============================================================================
# Posts
# =============================================================================
@router.get("/posts", response_model=PostListResponse)
def get_posts(
    category: Optional[CommunityCategoryEnum] = None,
    keyword: Optional[str] = Query(None, min_length=2),
    author_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """게시글 목록 조회"""
    skip = (page - 1) * limit
    posts, total = community_crud.get_posts(
        db,
        category=category,
        keyword=keyword,
        author_id=author_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return PostListResponse(
        posts=[_post_to_brief_response(p, current_user, db) for p in posts],
        total=total,
        page=page,
        limit=limit,
        has_next=(skip + limit) < total
    )


@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 작성"""
    post = community_crud.create_post(db, current_user.id, post_in)
    return _post_to_response(post, current_user, db)


@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """게시글 상세 조회"""
    post = community_crud.get_post_with_author(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )
    return _post_to_response(post, current_user, db)


@router.patch("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_in: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 수정"""
    post = community_crud.get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="수정 권한이 없습니다"
        )

    post = community_crud.update_post(db, post, post_in)
    return _post_to_response(post, current_user, db)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 삭제"""
    post = community_crud.get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="삭제 권한이 없습니다"
        )

    community_crud.delete_post(db, post)
    return None


# =============================================================================
# Post Likes
# =============================================================================
@router.post("/posts/{post_id}/like", response_model=LikeResponse)
def toggle_post_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 좋아요 토글"""
    post = community_crud.get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )

    is_liked, likes_count = community_crud.toggle_post_like(db, post_id, current_user.id)
    return LikeResponse(is_liked=is_liked, likes_count=likes_count)


# =============================================================================
# Comments
# =============================================================================
@router.get("/posts/{post_id}/comments", response_model=CommentListResponse)
def get_comments(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """댓글 목록 조회"""
    post = community_crud.get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )

    comments, total = community_crud.get_comments_by_post(db, post_id)
    return CommentListResponse(
        comments=[_comment_to_response(c, current_user, db) for c in comments],
        total=total
    )


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 작성"""
    post = community_crud.get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다"
        )

    # 부모 댓글 검증
    if comment_in.parent_id:
        parent = community_crud.get_comment(db, comment_in.parent_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="잘못된 부모 댓글입니다"
            )

    comment = community_crud.create_comment(db, post_id, current_user.id, comment_in)
    return _comment_to_response(comment, current_user, db)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 수정"""
    comment = community_crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없습니다"
        )
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="수정 권한이 없습니다"
        )

    comment = community_crud.update_comment(db, comment, comment_in)
    return _comment_to_response(comment, current_user, db)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 삭제"""
    comment = community_crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없습니다"
        )
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="삭제 권한이 없습니다"
        )

    community_crud.delete_comment(db, comment)
    return None


# =============================================================================
# Comment Likes
# =============================================================================
@router.post("/comments/{comment_id}/like", response_model=LikeResponse)
def toggle_comment_like(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 좋아요 토글"""
    comment = community_crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없습니다"
        )

    is_liked, likes_count = community_crud.toggle_comment_like(db, comment_id, current_user.id)
    return LikeResponse(is_liked=is_liked, likes_count=likes_count)


# =============================================================================
# Helpers
# =============================================================================
def _user_to_brief_response(user: User) -> UserBriefResponse:
    """User를 간략 응답으로 변환"""
    return UserBriefResponse(
        id=user.id,
        username=user.username,
        nickname=user.nickname,
        profile_image_url=user.profile_image_url
    )


def _post_to_response(post, current_user: Optional[User], db: Session) -> PostResponse:
    """Post를 응답으로 변환"""
    is_liked = False
    if current_user:
        is_liked = community_crud.is_post_liked_by_user(db, post.id, current_user.id)

    kid_name = None
    kid_image_url = None
    if post.kid:
        kid_name = post.kid.name
        kid_image_url = post.kid.profile_image_url

    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        kid_id=post.kid_id,
        category=post.category,
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        updated_at=post.updated_at,
        likes_count=post.likes_count,
        comment_count=post.comment_count,
        is_liked=is_liked,
        author=_user_to_brief_response(post.user) if post.user else None,
        kid_name=kid_name,
        kid_image_url=kid_image_url
    )


def _post_to_brief_response(post, current_user: Optional[User], db: Session) -> PostBriefResponse:
    """Post를 간략 응답으로 변환"""
    content_preview = post.content[:100] + "..." if len(post.content) > 100 else post.content

    return PostBriefResponse(
        id=post.id,
        category=post.category,
        title=post.title,
        content=content_preview,
        created_at=post.created_at,
        likes_count=post.likes_count,
        comment_count=post.comment_count,
        author=_user_to_brief_response(post.user) if post.user else None
    )


def _comment_to_response(comment, current_user: Optional[User], db: Session) -> CommentResponse:
    """Comment를 응답으로 변환"""
    is_liked = False
    if current_user:
        is_liked = community_crud.is_comment_liked_by_user(db, comment.id, current_user.id)

    replies = None
    if comment.replies:
        replies = [_comment_to_response(r, current_user, db) for r in comment.replies]

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=_user_to_brief_response(comment.user) if comment.user else None,
        replies=replies,
        likes_count=comment.likes_count,
        is_liked=is_liked
    )
