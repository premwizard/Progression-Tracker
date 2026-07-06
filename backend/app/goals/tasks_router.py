import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.goals import service as goal_service
from app.goals.schemas import TaskUpdate, TaskWithGoalResponse
from app.models.goal import Goal, Task
from app.models.user import User

router = APIRouter()

@router.get("", response_model=list[TaskWithGoalResponse])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
        .options(selectinload(Task.goal))
    )
    return list(result.scalars().all())

@router.put("/{task_id}", response_model=TaskWithGoalResponse)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Task.id == task_id, Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
        .options(selectinload(Task.goal))
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    updated_task = await goal_service.update_task(db, task, task_in)
    await goal_service.recalculate_goal_progress(db, task.goal_id)
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Response:
    result = await db.execute(
        select(Task)
        .join(Goal)
        .filter(Task.id == task_id, Goal.user_id == current_user.id, Task.deleted_at == None, Goal.deleted_at == None)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    goal_id = task.goal_id
    await goal_service.delete_task(db, task)
    await goal_service.recalculate_goal_progress(db, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
