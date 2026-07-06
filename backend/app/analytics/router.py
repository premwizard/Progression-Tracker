import uuid
from typing import Any
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.goal import Goal, Task
from app.analytics.schemas import AnalyticsSummaryResponse, WeeklyVelocityPoint, PriorityBreakdown

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    # 1. Fetch all goals
    goals_result = await db.execute(
        select(Goal).filter(Goal.user_id == current_user.id, Goal.deleted_at == None)
    )
    goals = goals_result.scalars().all()
    
    # 2. Fetch all tasks
    tasks_result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
    )
    tasks = tasks_result.scalars().all()

    # 3. Calculate basic metrics
    total_goals = len(goals)
    completed_goals = sum(1 for g in goals if g.status == "completed")
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    completion_rate = round((completed_tasks / total_tasks) * 100, 2) if total_tasks > 0 else 0.0

    # 4. Weekly velocity trend (last 7 days completed tasks)
    weekly_velocity = []
    now = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        target_day = now - timedelta(days=i)
        day_str = target_day.strftime("%a")
        
        day_completed_count = 0
        for task in tasks:
            if task.status == "completed" and task.updated_at:
                if task.updated_at.date() == target_day.date():
                    day_completed_count += 1
                    
        weekly_velocity.append(WeeklyVelocityPoint(day=day_str, count=day_completed_count))

    # 5. Priority Breakdown for pending tasks
    pending_tasks = [t for t in tasks if t.status != "completed"]
    low_count = sum(1 for t in pending_tasks if t.priority == "low")
    medium_count = sum(1 for t in pending_tasks if t.priority == "medium")
    high_count = sum(1 for t in pending_tasks if t.priority == "high")
    
    priority_breakdown = PriorityBreakdown(
        low=low_count,
        medium=medium_count,
        high=high_count
    )

    # 6. Streak calculation
    streak_count = 0
    completion_dates = {
        t.updated_at.date() for t in tasks 
        if t.status == "completed" and t.updated_at
    }
    
    today = now.date()
    yesterday = today - timedelta(days=1)
    
    # Start checking from today, or yesterday if no completion today yet
    current_date = today
    if today not in completion_dates and yesterday in completion_dates:
        current_date = yesterday
        
    while current_date in completion_dates:
        streak_count += 1
        current_date -= timedelta(days=1)

    return AnalyticsSummaryResponse(
        total_goals=total_goals,
        completed_goals=completed_goals,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_rate=completion_rate,
        weekly_velocity=weekly_velocity,
        priority_breakdown=priority_breakdown,
        streak_count=streak_count
    )
