import uuid
from datetime import date
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base_model import Base
from app.database.mixins import TimestampMixin, UUIDMixin


class DailySummary(Base, UUIDMixin, TimestampMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    # activity_id is null for user-level combined daily summary
    activity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("activity.id", ondelete="CASCADE"), nullable=True, index=True)
    
    summary_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    total_duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    total_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    completions_count: Mapped[int] = mapped_column(Integer, default=0)
    intensity_level: Mapped[int] = mapped_column(Integer, default=0)  # 0 to 4 GitHub-style level

    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", "summary_date", name="uq_user_activity_date_summary"),
    )


class StreakRecord(Base, UUIDMixin, TimestampMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    # activity_id is null for global overall streak
    activity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("activity.id", ondelete="CASCADE"), nullable=True, index=True)
    
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_active_days: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uq_user_activity_streak"),
    )


class ScreenTimeLog(Base, UUIDMixin, TimestampMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    package_name: Mapped[str] = mapped_column(String(200), nullable=False)
    app_name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="other")  # productivity, social, entertainment, health, tools, other
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    is_productive: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", "package_name", name="uq_user_date_package_screentime"),
    )

