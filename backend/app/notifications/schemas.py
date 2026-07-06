from pydantic import BaseModel, Field

class NotificationResponse(BaseModel):
    id: str = Field(..., description="Unique notification identifier")
    message: str = Field(..., description="The notification content text")
    type: str = Field(..., description="Type of alert (warning, success, info)")
    read: bool = Field(..., description="Indicates if the notification has been read")
    created_at: str = Field(..., description="ISO creation timestamp")
