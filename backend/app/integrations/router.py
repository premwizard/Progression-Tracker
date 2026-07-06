import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.goal import Goal, Task
from app.goals import service as goal_service
from app.integrations.schemas import (
    IntegrationResponse,
    IntegrationToggleRequest,
    IntegrationLogResponse,
    GitHubWebhookPayload,
)

router = APIRouter()

# In-memory storage for mock user connections and activity logs
connection_store: dict[uuid.UUID, dict[str, bool]] = {}
log_store: dict[uuid.UUID, list[dict]] = {}

def get_user_connections(user_id: uuid.UUID) -> dict[str, bool]:
    if user_id not in connection_store:
        connection_store[user_id] = {
            "github": False,
            "calendar": False,
            "slack": False
        }
    return connection_store[user_id]

def get_user_logs(user_id: uuid.UUID) -> list[dict]:
    if user_id not in log_store:
        log_store[user_id] = []
    return log_store[user_id]

@router.get("", response_model=list[IntegrationResponse])
async def get_integrations(current_user: User = Depends(get_current_active_user)):
    conns = get_user_connections(current_user.id)
    return [
        IntegrationResponse(
            name="github",
            description="Create tasks automatically when pushing commits to repositories.",
            connected=conns["github"]
        ),
        IntegrationResponse(
            name="calendar",
            description="Sync tasks due dates to Google Calendar seamlessly.",
            connected=conns["calendar"]
        ),
        IntegrationResponse(
            name="slack",
            description="Post weekly summaries and daily achievements to Slack channels.",
            connected=conns["slack"]
        )
    ]

@router.post("/{name}/toggle", response_model=IntegrationResponse)
async def toggle_integration(
    name: str,
    payload: IntegrationToggleRequest,
    current_user: User = Depends(get_current_active_user)
):
    conns = get_user_connections(current_user.id)
    if name not in conns:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    conns[name] = payload.connected
    
    # Insert logs
    logs = get_user_logs(current_user.id)
    now = datetime.now(timezone.utc).isoformat()
    action = "connected" if payload.connected else "disconnected"
    logs.insert(0, {
        "id": str(uuid.uuid4()),
        "timestamp": now,
        "service": name,
        "message": f"Successfully {action} integration link."
    })
    
    desc = ""
    if name == "github":
        desc = "Create tasks automatically when pushing commits to repositories."
    elif name == "calendar":
        desc = "Sync tasks due dates to Google Calendar seamlessly."
    elif name == "slack":
        desc = "Post weekly summaries and daily achievements to Slack channels."
        
    return IntegrationResponse(
        name=name,
        description=desc,
        connected=payload.connected
    )

@router.get("/logs", response_model=list[IntegrationLogResponse])
async def get_logs(current_user: User = Depends(get_current_active_user)):
    logs = get_user_logs(current_user.id)
    return [IntegrationLogResponse(**l) for l in logs]

@router.post("/webhooks/github", response_model=IntegrationLogResponse)
async def post_github_webhook(
    payload: GitHubWebhookPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    conns = get_user_connections(current_user.id)
    if not conns.get("github", False):
        raise HTTPException(status_code=400, detail="GitHub integration is not connected")
        
    # Fetch first active goal
    goals_result = await db.execute(
        select(Goal)
        .filter(Goal.user_id == current_user.id, Goal.status != "completed", Goal.deleted_at == None)
        .order_by(Goal.created_at.asc())
    )
    first_goal = goals_result.scalars().first()
    
    now = datetime.now(timezone.utc).isoformat()
    log_id = str(uuid.uuid4())
    logs = get_user_logs(current_user.id)
    
    if not first_goal:
        log_msg = f"Commit push processed: '{payload.commit_message}'. Warning: No active goals found to attach task."
        logs.insert(0, {
            "id": log_id,
            "timestamp": now,
            "service": "github",
            "message": log_msg
        })
        return IntegrationLogResponse(id=log_id, timestamp=now, service="github", message=log_msg)
        
    # Create subtask automatically
    task_title = f"[Commit] {payload.commit_message}"
    db_task = Task(
        goal_id=first_goal.id,
        title=task_title,
        description="Automatically created via GitHub push webhook",
        status="todo",
        priority="medium"
    )
    db.add(db_task)
    await db.flush()
    
    # Recalculate parent progress
    await goal_service.recalculate_goal_progress(db, first_goal.id)
    await db.commit()
    
    log_msg = f"Commit push processed. Automatically created task '{task_title}' under Goal '{first_goal.title}'."
    logs.insert(0, {
        "id": log_id,
        "timestamp": now,
        "service": "github",
        "message": log_msg
    })
    
    return IntegrationLogResponse(id=log_id, timestamp=now, service="github", message=log_msg)
