import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_model import Base
from app.database.mixins import AuditMixin, SoftDeleteMixin, UUIDMixin

class Goal(Base, UUIDMixin, AuditMixin, SoftDeleteMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="todo")  # 'todo', 'in_progress', 'completed', 'archived'
    target_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="goal",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class Task(Base, UUIDMixin, AuditMixin, SoftDeleteMixin):
    goal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("goal.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="todo")  # 'todo', 'in_progress', 'completed'
    priority: Mapped[str] = mapped_column(String, default="medium")  # 'low', 'medium', 'high'
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    goal: Mapped["Goal"] = relationship("Goal", back_populates="tasks")

    @property
    def goal_title(self) -> str | None:
        return self.goal.title if self.goal else None
