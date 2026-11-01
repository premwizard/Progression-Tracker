import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.activities import service as activity_service
from app.activities.schemas import ActivityCreate, ActivityResponse, ActivityUpdate
from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[ActivityResponse])
async def list_activities(
    category: str | None = Query(None, description="Filter activities by category"),
    status: str | None = Query("active", description="Filter by status (active, paused, archived, or null for all)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve all activities for the current user with live progress and streaks."""
    return await activity_service.list_activities(db, current_user.id, category=category, status=status)


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Create a new custom activity with custom tracking methods and heatmap configuration."""
    return await activity_service.create_activity(db, activity_in, current_user.id)


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve detailed activity information by ID."""
    act = await activity_service.get_activity_by_id(db, activity_id, current_user.id)
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    return act


@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: uuid.UUID,
    activity_in: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update activity metadata, thresholds, or status."""
    updated = await activity_service.update_activity(db, activity_id, activity_in, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Activity not found")
    return updated


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Response:
    """Soft delete an activity."""
    success = await activity_service.delete_activity(db, activity_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

