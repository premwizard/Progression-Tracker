from pydantic import BaseModel, Field

class IntegrationResponse(BaseModel):
    name: str = Field(..., description="The name of the external service (e.g. github, slack, calendar)")
    description: str = Field(..., description="The description of the integration capabilities")
    connected: bool = Field(..., description="Connection status indicator")

class IntegrationToggleRequest(BaseModel):
    connected: bool = Field(..., description="The target connection status to set")

class IntegrationLogResponse(BaseModel):
    id: str = Field(..., description="Unique event identifier")
    timestamp: str = Field(..., description="ISO timestamp of the webhook trigger event")
    service: str = Field(..., description="The source service (e.g. github)")
    message: str = Field(..., description="The description log message of the action processed")

class GitHubWebhookPayload(BaseModel):
    commit_message: str = Field(..., description="The commit message pushed to GitHub")
