from datetime import datetime, date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import (
    String, Text, Date, DateTime, ForeignKey, Boolean, Integer, Numeric,
    Enum as SQLEnum, ARRAY
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import (
    RecordTypeEnum,
    SleepTypeEnum,
    SleepQualityEnum,
    MealTypeEnum,
    DiaperTypeEnum,
    StoolAmountEnum,
    StoolConditionEnum,
    StoolColorEnum,
    enum_values,
)

if TYPE_CHECKING:
    from app.models.kid import Kid


class Record(Base):
    """기록 기본 테이블"""
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True)
    kid_id: Mapped[int] = mapped_column(ForeignKey("kids.id", ondelete="CASCADE"), nullable=False, index=True)
    record_type: Mapped[RecordTypeEnum] = mapped_column(
        SQLEnum(
            RecordTypeEnum,
            name="record_type_enum",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
        index=True
    )
    record_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    memo: Mapped[Optional[str]] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=datetime.utcnow)

    # Relationships
    kid: Mapped["Kid"] = relationship("Kid", back_populates="records")
    sleep_record: Mapped[Optional["SleepRecord"]] = relationship("SleepRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")
    growth_record: Mapped[Optional["GrowthRecord"]] = relationship("GrowthRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")
    meal_record: Mapped[Optional["MealRecord"]] = relationship("MealRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")
    health_record: Mapped[Optional["HealthRecord"]] = relationship("HealthRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")
    diaper_record: Mapped[Optional["DiaperRecord"]] = relationship("DiaperRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")
    etc_record: Mapped[Optional["EtcRecord"]] = relationship("EtcRecord", back_populates="record", uselist=False, cascade="all, delete-orphan")


class SleepRecord(Base):
    """수면 기록"""
    __tablename__ = "sleep_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    sleep_type: Mapped[SleepTypeEnum] = mapped_column(
        SQLEnum(
            SleepTypeEnum,
            name="sleep_type_enum",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False
    )
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sleep_quality: Mapped[Optional[SleepQualityEnum]] = mapped_column(
        SQLEnum(
            SleepQualityEnum,
            name="sleep_quality_enum",
            create_type=False,
            values_callable=enum_values,
        )
    )

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="sleep_record")

    @property
    def duration_hours(self) -> float:
        """수면 시간 (시간 단위)"""
        delta = self.end_datetime - self.start_datetime
        return round(delta.total_seconds() / 3600, 2)


class GrowthRecord(Base):
    """성장 기록"""
    __tablename__ = "growth_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    height_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2))
    head_circumference_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2))
    activities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String(50)))

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="growth_record")


class MealRecord(Base):
    """식사 기록"""
    __tablename__ = "meal_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    meal_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unknown_time: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    meal_type: Mapped[MealTypeEnum] = mapped_column(
        SQLEnum(
            MealTypeEnum,
            name="meal_type_enum",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False
    )
    meal_detail: Mapped[Optional[str]] = mapped_column(String(200))
    amount_ml: Mapped[Optional[int]] = mapped_column(Integer)
    amount_text: Mapped[Optional[str]] = mapped_column(String(100))
    burp: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="meal_record")


class HealthRecord(Base):
    """건강 기록"""
    __tablename__ = "health_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    health_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unknown_time: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    symptoms: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String(50)))
    medicines: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String(50)))

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="health_record")


class DiaperRecord(Base):
    """배변 기록"""
    __tablename__ = "diaper_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    diaper_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unknown_time: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    diaper_type: Mapped[DiaperTypeEnum] = mapped_column(
        SQLEnum(
            DiaperTypeEnum,
            name="diaper_type_enum",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False
    )
    amount: Mapped[Optional[StoolAmountEnum]] = mapped_column(
        SQLEnum(
            StoolAmountEnum,
            name="stool_amount_enum",
            create_type=False,
            values_callable=enum_values,
        )
    )
    condition: Mapped[Optional[StoolConditionEnum]] = mapped_column(
        SQLEnum(
            StoolConditionEnum,
            name="stool_condition_enum",
            create_type=False,
            values_callable=enum_values,
        )
    )
    color: Mapped[Optional[StoolColorEnum]] = mapped_column(
        SQLEnum(
            StoolColorEnum,
            name="stool_color_enum",
            create_type=False,
            values_callable=enum_values,
        )
    )

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="diaper_record")


class EtcRecord(Base):
    """기타 기록"""
    __tablename__ = "etc_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)

    # Relationship
    record: Mapped["Record"] = relationship("Record", back_populates="etc_record")
