from typing import Optional, List, Tuple

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, joinedload

from app.models.community import Post, Comment, PostLike, CommentLike
from app.models.enums import CommunityCategoryEnum
from app.schemas.community import PostCreate, PostUpdate, CommentCreate, CommentUpdate


# =============================================================================
# Post CRUD
# =============================================================================
def get_post(db: Session, post_id: int) -> Optional[Post]:
    """게시글 조회 (ID)"""
    return db.get(Post, post_id)


def get_post_with_author(db: Session, post_id: int) -> Optional[Post]:
    """게시글 조회 (작성자 정보 포함)"""
    stmt = (
        select(Post)
        .options(joinedload(Post.user), joinedload(Post.kid))
        .where(Post.id == post_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_posts(
    db: Session,
    category: Optional[CommunityCategoryEnum] = None,
    keyword: Optional[str] = None,
    author_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> Tuple[List[Post], int]:
    """게시글 목록 조회"""
    # 기본 쿼리
    stmt = select(Post).options(joinedload(Post.user))

    # 필터
    if category:
        stmt = stmt.where(Post.category == category)
    if author_id:
        stmt = stmt.where(Post.user_id == author_id)
    if keyword:
        stmt = stmt.where(
            or_(
                Post.title.ilike(f"%{keyword}%"),
                Post.content.ilike(f"%{keyword}%")
            )
        )

    # 정렬
    sort_column = getattr(Post, sort_by, Post.created_at)
    if sort_order == "desc":
        stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(sort_column.asc())

    # 전체 개수
    count_stmt = select(func.count(Post.id))
    if category:
        count_stmt = count_stmt.where(Post.category == category)
    if author_id:
        count_stmt = count_stmt.where(Post.user_id == author_id)
    if keyword:
        count_stmt = count_stmt.where(
            or_(
                Post.title.ilike(f"%{keyword}%"),
                Post.content.ilike(f"%{keyword}%")
            )
        )
    total = db.execute(count_stmt).scalar() or 0

    # 페이징
    stmt = stmt.offset(skip).limit(limit)
    posts = list(db.execute(stmt).unique().scalars().all())

    return posts, total


def create_post(db: Session, user_id: int, post_in: PostCreate) -> Post:
    """게시글 작성"""
    post = Post(
        user_id=user_id,
        kid_id=post_in.kid_id,
        category=post_in.category,
        title=post_in.title,
        content=post_in.content,
        image_url=post_in.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post: Post, post_in: PostUpdate) -> Post:
    """게시글 수정"""
    update_data = post_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post: Post) -> None:
    """게시글 삭제"""
    db.delete(post)
    db.commit()


# =============================================================================
# Post Like CRUD
# =============================================================================
def get_post_like(db: Session, post_id: int, user_id: int) -> Optional[PostLike]:
    """게시글 좋아요 조회"""
    stmt = select(PostLike).where(
        and_(PostLike.post_id == post_id, PostLike.user_id == user_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def toggle_post_like(db: Session, post_id: int, user_id: int) -> Tuple[bool, int]:
    """게시글 좋아요 토글 (반환: is_liked, likes_count)"""
    like = get_post_like(db, post_id, user_id)
    post = get_post(db, post_id)

    if not post:
        return False, 0

    if like:
        # 좋아요 취소
        db.delete(like)
        post.likes_count = max(0, post.likes_count - 1)
        is_liked = False
    else:
        # 좋아요 추가
        new_like = PostLike(post_id=post_id, user_id=user_id)
        db.add(new_like)
        post.likes_count += 1
        is_liked = True

    db.commit()
    db.refresh(post)
    return is_liked, post.likes_count


def is_post_liked_by_user(db: Session, post_id: int, user_id: int) -> bool:
    """사용자의 게시글 좋아요 여부"""
    return get_post_like(db, post_id, user_id) is not None


# =============================================================================
# Comment CRUD
# =============================================================================
def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    """댓글 조회 (ID)"""
    return db.get(Comment, comment_id)


def get_comments_by_post(
    db: Session,
    post_id: int,
    include_replies: bool = True
) -> Tuple[List[Comment], int]:
    """게시글의 댓글 목록 조회"""
    if include_replies:
        # 최상위 댓글만 조회 (대댓글은 relationship으로 가져옴)
        stmt = (
            select(Comment)
            .options(
                joinedload(Comment.user),
                joinedload(Comment.replies).joinedload(Comment.user)
            )
            .where(and_(Comment.post_id == post_id, Comment.parent_id.is_(None)))
            .order_by(Comment.created_at.asc())
        )
    else:
        stmt = (
            select(Comment)
            .options(joinedload(Comment.user))
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
        )

    comments = list(db.execute(stmt).unique().scalars().all())

    # 전체 댓글 수
    count_stmt = select(func.count(Comment.id)).where(Comment.post_id == post_id)
    total = db.execute(count_stmt).scalar() or 0

    return comments, total


def create_comment(
    db: Session,
    post_id: int,
    user_id: int,
    comment_in: CommentCreate
) -> Comment:
    """댓글 작성"""
    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=comment_in.content,
        parent_id=comment_in.parent_id,
    )
    db.add(comment)

    # 게시글 댓글 수 증가
    post = get_post(db, post_id)
    if post:
        post.comment_count += 1

    db.commit()
    db.refresh(comment)
    return comment


def update_comment(db: Session, comment: Comment, comment_in: CommentUpdate) -> Comment:
    """댓글 수정"""
    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    """댓글 삭제"""
    post = get_post(db, comment.post_id)

    # 대댓글 수 계산
    replies_count = len(comment.replies) if comment.replies else 0

    db.delete(comment)

    # 게시글 댓글 수 감소 (본 댓글 + 대댓글)
    if post:
        post.comment_count = max(0, post.comment_count - 1 - replies_count)

    db.commit()


# =============================================================================
# Comment Like CRUD
# =============================================================================
def get_comment_like(db: Session, comment_id: int, user_id: int) -> Optional[CommentLike]:
    """댓글 좋아요 조회"""
    stmt = select(CommentLike).where(
        and_(CommentLike.comment_id == comment_id, CommentLike.user_id == user_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def toggle_comment_like(db: Session, comment_id: int, user_id: int) -> Tuple[bool, int]:
    """댓글 좋아요 토글 (반환: is_liked, likes_count)"""
    like = get_comment_like(db, comment_id, user_id)
    comment = get_comment(db, comment_id)

    if not comment:
        return False, 0

    if like:
        # 좋아요 취소
        db.delete(like)
        comment.likes_count = max(0, comment.likes_count - 1)
        is_liked = False
    else:
        # 좋아요 추가
        new_like = CommentLike(comment_id=comment_id, user_id=user_id)
        db.add(new_like)
        comment.likes_count += 1
        is_liked = True

    db.commit()
    db.refresh(comment)
    return is_liked, comment.likes_count


def is_comment_liked_by_user(db: Session, comment_id: int, user_id: int) -> bool:
    """사용자의 댓글 좋아요 여부"""
    return get_comment_like(db, comment_id, user_id) is not None


def get_popular_post(db: Session, days: int = 7) -> Optional[Post]:
    """최근 N일 내 가장 인기있는 게시글 조회 (좋아요 기준)"""
    from datetime import datetime, timedelta

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(Post)
        .options(joinedload(Post.user))
        .where(Post.created_at >= cutoff_date)
        .order_by(Post.likes_count.desc(), Post.created_at.desc())
        .limit(1)
    )

    return db.execute(stmt).scalar_one_or_none()
