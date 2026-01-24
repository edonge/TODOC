from datetime import datetime, date
from typing import TYPE_CHECKING, Optional, List
import enum

from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.record import Record
    from app.models.community import Post


class GenderEnum(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class Kid(Base):
    __tablename__ = "kids"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[GenderEnum] = mapped_column(SQLEnum(GenderEnum, name="gender_enum", create_type=False), nullable=False)
    profile_image_url: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="kids")
    records: Mapped[List["Record"]] = relationship("Record", back_populates="kid", cascade="all, delete-orphan")
    posts: Mapped[List["Post"]] = relationship("Post", back_populates="kid")

    @property
    def age_in_months(self) -> int:
        """개월 수 계산"""
        today = date.today()
        months = (today.year - self.birth_date.year) * 12 + (today.month - self.birth_date.month)
        if today.day < self.birth_date.day:
            months -= 1
        return max(0, months)
