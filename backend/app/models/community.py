from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CommunityCategoryEnum, enum_values

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.kid import Kid


class Post(Base):
    """게시글"""
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kid_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kids.id", ondelete="SET NULL"), index=True)
    category: Mapped[CommunityCategoryEnum] = mapped_column(
        SQLEnum(
            CommunityCategoryEnum,
            name="community_category_enum",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text)
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="posts")
    kid: Mapped[Optional["Kid"]] = relationship("Kid", back_populates="posts")
    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes: Mapped[List["PostLike"]] = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    """댓글"""
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(String(1000), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), index=True)
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=datetime.utcnow)

    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="comments")
    parent: Mapped[Optional["Comment"]] = relationship("Comment", back_populates="replies", remote_side=[id])
    replies: Mapped[List["Comment"]] = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    likes: Mapped[List["CommentLike"]] = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")


class PostLike(Base):
    """게시글 좋아요"""
    __tablename__ = "post_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_likes_post_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="post_likes")


class CommentLike(Base):
    """댓글 좋아요"""
    __tablename__ = "comment_likes"
    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_comment_likes_comment_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    comment: Mapped["Comment"] = relationship("Comment", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="comment_likes")
