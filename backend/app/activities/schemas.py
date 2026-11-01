import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


VALID_CATEGORIES = ["Fitness", "Learning", "Projects", "Career", "Health", "Personal", "Custom"]
VALID_METHODS = ["time", "quantity", "completion", "automatic"]
VALID_STATUSES = ["active", "paused", "archived"]


class HeatmapConfig(BaseModel):
    mode: Literal["duration", "quantity", "target_percentage"] = "duration"
    unit: str | None = "minutes"
    levels: dict[str, float] = Field(
        default_factory=lambda: {"1": 15.0, "2": 30.0, "3": 45.0, "4": 60.0}
    )
    target_relative: bool = False


class TodayProgress(BaseModel):
    duration_seconds: int = 0
    quantity: float = 0.0
    completed: bool = False
    progress_percent: float = 0.0


class ActivityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the activity (e.g. Gym, Study)")
    description: str | None = Field(None, max_length=500, description="Optional activity details")
    icon: str = Field("dumbbell", max_length=50, description="Lucide icon identifier (e.g. dumbbell, book-open, code)")
    color: str = Field("#F97316", max_length=30, description="Hex color token or accent string")
    category: str = Field("Personal", description="Category grouping")
    tracking_methods: list[str] = Field(
        default_factory=lambda: ["time"],
        description="One or multiple tracking methods: time, quantity, completion, automatic"
    )
    metric_unit: str | None = Field(None, max_length=50, description="Unit of measure (e.g. minutes, reps, pages, km)")
    daily_target: float | None = Field(None, ge=0, description="Daily target goal quantity or duration")
    weekly_target: float | None = Field(None, ge=0, description="Weekly target goal quantity or duration")
    start_date: datetime | None = None
    end_date: datetime | None = None
    heatmap_config: dict[str, Any] = Field(
        default_factory=lambda: {
            "mode": "duration",
            "unit": "minutes",
            "levels": {"1": 15.0, "2": 30.0, "3": 45.0, "4": 60.0},
            "target_relative": False
        }
    )
    reminder_config: dict[str, Any] | None = None

    @field_validator("tracking_methods")
    @classmethod
    def validate_tracking_methods(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one tracking method must be specified")
        for method in v:
            if method not in VALID_METHODS:
                raise ValueError(f"Invalid tracking method '{method}'. Must be one of {VALID_METHODS}")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        # Normalize category
        matched = next((c for c in VALID_CATEGORIES if c.lower() == v.lower()), None)
        return matched if matched else v


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=30)
    category: str | None = None
    tracking_methods: list[str] | None = None
    metric_unit: str | None = None
    daily_target: float | None = Field(None, ge=0)
    weekly_target: float | None = Field(None, ge=0)
    status: Literal["active", "paused", "archived"] | None = None
    heatmap_config: dict[str, Any] | None = None
    reminder_config: dict[str, Any] | None = None

    @field_validator("tracking_methods")
    @classmethod
    def validate_tracking_methods(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            if not v:
                raise ValueError("At least one tracking method must be specified")
            for method in v:
                if method not in VALID_METHODS:
                    raise ValueError(f"Invalid tracking method '{method}'. Must be one of {VALID_METHODS}")
        return v


class ActivityResponse(ActivityBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    today_progress: TodayProgress = Field(default_factory=TodayProgress)
    current_streak: int = 0

    model_config = ConfigDict(from_attributes=True)
