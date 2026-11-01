import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# --- Method 1: Time-Based Tracking Schemas ---

class SessionStartRequest(BaseModel):
    activity_id: uuid.UUID
    notes: str | None = Field(None, max_length=1000)


class SessionPauseRequest(BaseModel):
    notes: str | None = Field(None, max_length=1000)


class SessionResumeRequest(BaseModel):
    pass


class SessionFinishRequest(BaseModel):
    notes: str | None = Field(None, max_length=1000)


class SessionManualCreateRequest(BaseModel):
    activity_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    notes: str | None = Field(None, max_length=1000)


class SessionResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    user_id: uuid.UUID
    start_time: datetime
    end_time: datetime | None = None
    paused_duration_seconds: int = 0
    duration_seconds: int = 0
    status: Literal["running", "paused", "completed", "cancelled"]
    pause_intervals: list[dict[str, Any]] | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Method 2: Quantity-Based Tracking Schemas ---

class QuantityLogRequest(BaseModel):
    activity_id: uuid.UUID
    quantity_value: float = Field(..., gt=0, description="Amount completed (e.g. 10 reps, 5 km)")
    log_date: date | None = Field(default_factory=date.today, description="Date of the log entry")
    notes: str | None = Field(None, max_length=1000)


# --- Method 3: Completion-Based Tracking Schemas ---

class CompletionLogRequest(BaseModel):
    activity_id: uuid.UUID
    is_completed: bool = Field(True, description="Mark as completed (True) or undo completion (False)")
    log_date: date | None = Field(default_factory=date.today, description="Date of completion")
    notes: str | None = Field(None, max_length=1000)


# --- Generic Activity Log Response ---

class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    user_id: uuid.UUID
    log_date: date
    tracking_method: str
    quantity_value: float | None = None
    is_completed: bool = False
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Method 4: Automatic Tracking (Screen Time) Schemas ---

class ScreenTimeItem(BaseModel):
    package_name: str = Field(..., max_length=200)
    app_name: str = Field(..., max_length=100)
    category: str = Field("other", max_length=50)  # productivity, social, entertainment, health, tools, other
    duration_minutes: int = Field(..., ge=0)
    is_productive: bool = False
    log_date: date = Field(default_factory=date.today)


class ScreenTimeBatchRequest(BaseModel):
    items: list[ScreenTimeItem]


class ScreenTimeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    log_date: date
    package_name: str
    app_name: str
    category: str
    duration_minutes: int
    is_productive: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyActivitySummaryResponse(BaseModel):
    activity_id: uuid.UUID
    activity_name: str
    date: date
    total_duration_seconds: int = 0
    total_quantity: float = 0.0
    is_completed: bool = False
    daily_target: float | None = None
    progress_percentage: float = 0.0
    intensity_level: int = 0
