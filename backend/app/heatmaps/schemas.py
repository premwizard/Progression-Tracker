import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HeatmapDayCell(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    intensity_level: int = Field(0, ge=0, le=4, description="0=None, 1=Low, 2=Medium, 3=High, 4=Peak")
    total_duration_seconds: int = 0
    total_quantity: float = 0.0
    completions_count: int = 0
    is_active: bool = False


class HeatmapActivityInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str
    icon: str
    category: str
    metric_unit: str | None = None
    daily_target: float | None = None
    tracking_methods: list[str] = Field(default_factory=list)
    heatmap_config: dict[str, Any] = Field(default_factory=dict)


class HeatmapGridResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    start_date: date
    end_date: date
    total_days: int
    active_days: int
    consistency_percentage: float
    current_streak: int = 0
    longest_streak: int = 0
    total_duration_seconds: int = 0
    total_quantity: float = 0.0
    total_completions: int = 0
    activity: HeatmapActivityInfo | None = None
    level_counts: dict[str, int] = Field(
        default_factory=lambda: {"0": 0, "1": 0, "2": 0, "3": 0, "4": 0}
    )
    cells: list[HeatmapDayCell] = Field(default_factory=list)


class DaySessionDrilldown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    start_time: datetime
    end_time: datetime | None = None
    duration_seconds: int = 0
    status: str
    notes: str | None = None


class DayLogDrilldown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tracking_method: str
    quantity_value: float | None = None
    is_completed: bool = False
    notes: str | None = None


class DayActivityDrilldown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    activity_id: uuid.UUID
    activity_name: str
    activity_color: str
    activity_icon: str
    activity_category: str
    metric_unit: str | None = None
    total_duration_seconds: int = 0
    total_quantity: float = 0.0
    is_completed: bool = False
    intensity_level: int = 0
    sessions: list[DaySessionDrilldown] = Field(default_factory=list)
    logs: list[DayLogDrilldown] = Field(default_factory=list)


class HeatmapDrilldownResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    target_date: date
    overall_intensity: int = 0
    total_duration_seconds: int = 0
    total_quantity: float = 0.0
    total_completions: int = 0
    activities: list[DayActivityDrilldown] = Field(default_factory=list)


class RebuildSummaryRequest(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    activity_id: uuid.UUID | None = None


class RebuildSummaryResponse(BaseModel):
    recalculated_days: int
    message: str
