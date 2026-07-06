from pydantic import BaseModel, Field


class WeeklyVelocityPoint(BaseModel):
    day: str = Field(..., description="Day abbreviation (e.g. Mon, Tue)")
    count: int = Field(..., description="Count of tasks completed on this day")

class PriorityBreakdown(BaseModel):
    low: int = Field(0, description="Count of pending low priority tasks")
    medium: int = Field(0, description="Count of pending medium priority tasks")
    high: int = Field(0, description="Count of pending high priority tasks")

class AnalyticsSummaryResponse(BaseModel):
    total_goals: int = Field(..., description="Total goals")
    completed_goals: int = Field(..., description="Completed goals")
    total_tasks: int = Field(..., description="Total tasks")
    completed_tasks: int = Field(..., description="Completed tasks")
    completion_rate: float = Field(..., description="Task completion rate percentage")
    weekly_velocity: list[WeeklyVelocityPoint] = Field(..., description="Last 7 days task completion trend")
    priority_breakdown: PriorityBreakdown = Field(..., description="Pending tasks by priority")
    streak_count: int = Field(..., description="Daily task completion streak")
