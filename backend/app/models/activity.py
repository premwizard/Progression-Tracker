import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import Base
from app.database.mixins import AuditMixin, SoftDeleteMixin, UUIDMixin


class Activity(Base, UUIDMixin, AuditMixin, SoftDeleteMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="dumbbell")
    color: Mapped[str] = mapped_column(String(30), default="#F97316")
    category: Mapped[str] = mapped_column(String(50), default="Personal", index=True)
    
    # Tracking configuration
    tracking_methods: Mapped[list[str]] = mapped_column(JSON, default=lambda: ["time"])
    metric_unit: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "minutes", "reps", "pages", "km"
    daily_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    weekly_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)  # 'active', 'paused', 'archived'

    # Heatmap & Reminders JSON configuration
    # Example heatmap_config: {"mode": "duration", "unit": "minutes", "levels": {"1": 15, "2": 30, "3": 45, "4": 60}, "target_relative": false}
    heatmap_config: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    reminder_config: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    sessions: Mapped[list["ActivitySession"]] = relationship(
        "ActivitySession",
        back_populates="activity",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ActivitySession.start_time.desc()",
    )
    logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="activity",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ActivityLog.log_date.desc()",
    )


class ActivitySession(Base, UUIDMixin, AuditMixin, SoftDeleteMixin):
    activity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("activity.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    paused_duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="running", index=True)  # 'running', 'paused', 'completed', 'cancelled'
    
    # Detailed intervals: [{"pause_start": "...", "pause_end": "..."}]
    pause_intervals: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationships
    activity: Mapped["Activity"] = relationship("Activity", back_populates="sessions")


class ActivityLog(Base, UUIDMixin, AuditMixin, SoftDeleteMixin):
    activity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("activity.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    tracking_method: Mapped[str] = mapped_column(String(30), nullable=False)  # 'quantity', 'completion', 'manual_time'
    quantity_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationships
    activity: Mapped["Activity"] = relationship("Activity", back_populates="logs")

