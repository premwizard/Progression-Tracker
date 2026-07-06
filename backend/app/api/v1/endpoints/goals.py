import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.goals import service as goal_service
from app.goals.schemas import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.models.goal import Task
from app.models.user import User

router = APIRouter()

@router.get("", response_model=list[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return await goal_service.get_goals_for_user(db, current_user.id)

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return await goal_service.create_goal(db, goal_in, current_user.id)

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    goal_in: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return await goal_service.update_goal(db, goal, goal_in)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_goal(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Response:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await goal_service.delete_goal(db, goal)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Task Sub-resource Endpoints
@router.post("/{goal_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    goal_id: uuid.UUID,
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    task = await goal_service.create_task(db, goal_id, task_in)
    await goal_service.recalculate_goal_progress(db, goal_id)
    return task

@router.put("/{goal_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    goal_id: uuid.UUID,
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    result = await db.execute(
        select(Task).filter(Task.id == task_id, Task.goal_id == goal_id, Task.deleted_at == None)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    updated_task = await goal_service.update_task(db, task, task_in)
    await goal_service.recalculate_goal_progress(db, goal_id)
    return updated_task

@router.delete("/{goal_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_task(
    goal_id: uuid.UUID,
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Response:
    goal = await goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    result = await db.execute(
        select(Task).filter(Task.id == task_id, Task.goal_id == goal_id, Task.deleted_at == None)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await goal_service.delete_task(db, task)
    await goal_service.recalculate_goal_progress(db, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
