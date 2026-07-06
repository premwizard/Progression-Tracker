from pydantic import BaseModel, Field

class AIChatRequest(BaseModel):
    message: str = Field(..., description="The chat message sent by the user")

class SuggestedTask(BaseModel):
    title: str = Field(..., description="The title of the task")

class SuggestedGoal(BaseModel):
    title: str = Field(..., description="The title of the goal")
    description: str | None = Field(None, description="Optional description of the goal")
    tasks: list[SuggestedTask] = Field(default=[], description="Sub-tasks proposed for this goal")

class AIChatResponse(BaseModel):
    response: str = Field(..., description="The text response from the AI coach")
    suggested_goals: list[SuggestedGoal] | None = Field(None, description="Optional suggested goal schemas to add")
