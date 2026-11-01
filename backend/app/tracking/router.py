import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.summary import ScreenTimeLog
from app.models.user import User
from app.tracking import service as tracking_service
from app.tracking.schemas import (
    ActivityLogResponse,
    CompletionLogRequest,
    QuantityLogRequest,
    ScreenTimeBatchRequest,
    ScreenTimeResponse,
    SessionFinishRequest,
    SessionManualCreateRequest,
    SessionPauseRequest,
    SessionResponse,
    SessionResumeRequest,
    SessionStartRequest,
)

router = APIRouter()


# --- Method 1: Time-Based Tracking Endpoints ---

@router.post("/sessions/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: SessionStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Start an activity timer. Returns existing running session if one is already active."""
    return await tracking_service.start_session(
        db, payload.activity_id, current_user.id, notes=payload.notes
    )


@router.post("/sessions/{session_id}/pause", response_model=SessionResponse)
async def pause_session(
    session_id: uuid.UUID,
    payload: SessionPauseRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Pause an active timer session."""
    notes = payload.notes if payload else None
    return await tracking_service.pause_session(db, session_id, current_user.id, notes=notes)


@router.post("/sessions/{session_id}/resume", response_model=SessionResponse)
async def resume_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Resume a paused timer session."""
    return await tracking_service.resume_session(db, session_id, current_user.id)


@router.post("/sessions/{session_id}/finish", response_model=SessionResponse)
async def finish_session(
    session_id: uuid.UUID,
    payload: SessionFinishRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Finish session, compute duration mathematically from timestamps, and update heatmaps/streaks."""
    notes = payload.notes if payload else None
    return await tracking_service.finish_session(db, session_id, current_user.id, notes=notes)


@router.post("/sessions/{session_id}/cancel", response_model=SessionResponse)
async def cancel_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Cancel an active session without contributing to progression."""
    return await tracking_service.cancel_session(db, session_id, current_user.id)


@router.post("/sessions/manual", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def manual_add_session(
    payload: SessionManualCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Manually add a completed session with exact start and end times."""
    return await tracking_service.manual_add_session(db, payload, current_user.id)


@router.get("/sessions/active", response_model=SessionResponse | None)
async def get_active_session(
    activity_id: uuid.UUID | None = Query(None, description="Optional activity filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve the currently active (running or paused) session for timer synchronization."""
    return await tracking_service.get_active_session(db, current_user.id, activity_id=activity_id)


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    activity_id: uuid.UUID | None = Query(None, description="Filter sessions by activity"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List session history."""
    return await tracking_service.list_sessions(
        db, current_user.id, activity_id=activity_id, limit=limit, offset=offset
    )


# --- Method 2: Quantity-Based Tracking Endpoints ---

@router.post("/quantity", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
async def log_quantity(
    payload: QuantityLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Log quantity progress (e.g. +10 pushups, +5 pages) and recalculate daily heatmaps."""
    return await tracking_service.log_quantity(
        db,
        activity_id=payload.activity_id,
        user_id=current_user.id,
        quantity_value=payload.quantity_value,
        log_date=payload.log_date,
        notes=payload.notes,
    )


# --- Method 3: Completion-Based Tracking Endpoints ---

@router.post("/completion", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
async def toggle_completion(
    payload: CompletionLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Mark daily activity as completed or undo completion."""
    return await tracking_service.set_completion(
        db,
        activity_id=payload.activity_id,
        user_id=current_user.id,
        is_completed=payload.is_completed,
        log_date=payload.log_date,
        notes=payload.notes,
    )


# --- Method 4: Automatic (Screen Time) Tracking Endpoints ---

@router.post("/screentime/batch", response_model=list[ScreenTimeResponse])
async def upload_screen_time_batch(
    payload: ScreenTimeBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Batch upload Android screen time metrics."""
    return await tracking_service.record_screen_time_batch(
        db, current_user.id, payload.items
    )


@router.get("/screentime", response_model=list[ScreenTimeResponse])
async def get_screen_time(
    log_date: date | None = Query(default=None, description="Date filter, defaults to today"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve screen time records for a date."""
    target_date = log_date or date.today()
    res = await db.execute(
        select(ScreenTimeLog).filter(
            ScreenTimeLog.user_id == current_user.id,
            ScreenTimeLog.log_date == target_date,
        ).order_by(ScreenTimeLog.duration_minutes.desc())
    )
    return list(res.scalars().all())

