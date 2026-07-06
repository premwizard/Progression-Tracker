import uuid
from datetime import datetime
from pydantic import BaseModel, Field

# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task")
    description: str | None = Field(None, description="Optional description of the task")
    status: str = Field("todo", description="Status of the task (todo, in_progress, completed)")
    priority: str = Field("medium", description="Priority of the task (low, medium, high)")
    due_date: datetime | None = Field(None, description="Optional due date for the task")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: datetime | None = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskWithGoalResponse(TaskResponse):
    goal_title: str | None = None

    class Config:
        from_attributes = True

# Goal Schemas
class GoalBase(BaseModel):
    title: str = Field(..., description="The title of the goal")
    description: str | None = Field(None, description="Optional description of the goal")
    status: str = Field("todo", description="Status of the goal (todo, in_progress, completed, archived)")
    target_date: datetime | None = Field(None, description="Optional target date to complete the goal")
    progress: float = Field(0.0, description="The percentage completion progress (0-100)")

class GoalCreate(BaseModel):
    title: str = Field(..., description="The title of the goal")
    description: str | None = Field(None, description="Optional description of the goal")
    target_date: datetime | None = Field(None, description="Optional target date to complete the goal")
    tasks: list[TaskCreate] | None = Field(None, description="Optional initial list of tasks")

class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    target_date: datetime | None = None
    progress: float | None = None

class GoalResponse(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskResponse] = []

    class Config:
        from_attributes = True
