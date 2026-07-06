import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.goal import Goal, Task
from app.models.user import User
from app.notifications.schemas import NotificationResponse

router = APIRouter()

# In-memory store for read notifications: { user_id: set(notif_id) }
read_store: dict[uuid.UUID, set[str]] = {}

def get_user_read_set(user_id: uuid.UUID) -> set[str]:
    if user_id not in read_store:
        read_store[user_id] = set()
    return read_store[user_id]

@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    read_set = get_user_read_set(current_user.id)
    notifications = []
    
    # 1. Fetch user goals
    goals_result = await db.execute(
        select(Goal).filter(Goal.user_id == current_user.id, Goal.deleted_at == None)
    )
    goals = goals_result.scalars().all()
    
    # 2. Fetch user tasks
    tasks_result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
    )
    tasks = tasks_result.scalars().all()
    
    # Process completed goals
    for goal in goals:
        if goal.progress == 100.0:
            notif_id = f"goal_completed_{goal.id}"
            notifications.append(
                NotificationResponse(
                    id=notif_id,
                    message=f"🎉 Congratulations! Goal '{goal.title}' is 100% completed!",
                    type="success",
                    read=notif_id in read_set,
                    created_at=goal.updated_at.isoformat() if goal.updated_at else datetime.now(timezone.utc).isoformat()
                )
            )
            
    # Process near-due tasks (next 48 hours)
    now = datetime.now(timezone.utc)
    for task in tasks:
        if task.status != "completed" and task.due_date:
            time_left = task.due_date - now
            if timedelta(seconds=0) <= time_left <= timedelta(hours=48):
                notif_id = f"task_due_{task.id}"
                due_str = task.due_date.strftime("%Y-%m-%d %H:%M")
                notifications.append(
                    NotificationResponse(
                        id=notif_id,
                        message=f"⚠️ Task '{task.title}' is due soon (due {due_str})",
                        type="warning",
                        read=notif_id in read_set,
                        created_at=task.created_at.isoformat() if task.created_at else now.isoformat()
                    )
                )
                
    # Sort: unread first, then date desc
    notifications.sort(key=lambda x: (x.read, x.created_at))
    return notifications

@router.post("/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: str,
    current_user: User = Depends(get_current_active_user)
):
    read_set = get_user_read_set(current_user.id)
    read_set.add(notif_id)
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    read_set = get_user_read_set(current_user.id)
    
    # Retrieve all goals & tasks to generate same IDs
    goals_result = await db.execute(
        select(Goal).filter(Goal.user_id == current_user.id, Goal.deleted_at == None)
    )
    goals = goals_result.scalars().all()
    
    tasks_result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
    )
    tasks = tasks_result.scalars().all()
    
    for goal in goals:
        if goal.progress == 100.0:
            read_set.add(f"goal_completed_{goal.id}")
            
    now = datetime.now(timezone.utc)
    for task in tasks:
        if task.status != "completed" and task.due_date:
            time_left = task.due_date - now
            if timedelta(seconds=0) <= time_left <= timedelta(hours=48):
                read_set.add(f"task_due_{task.id}")
                
    return {"status": "success"}
