import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database.session import get_db
from app.heatmaps.schemas import (
    HeatmapDrilldownResponse,
    HeatmapGridResponse,
    RebuildSummaryRequest,
    RebuildSummaryResponse,
)
from app.heatmaps.service import (
    get_day_drilldown,
    get_heatmap_grid,
    rebuild_daily_summaries,
)
from app.models.user import User

router = APIRouter()


@router.get(
    "/overall",
    response_model=HeatmapGridResponse,
    summary="Get overall combined progression heatmap grid",
    description="Returns a continuous daily heatmap array (Levels 0-4) aggregated across all user activities.",
)
async def get_overall_heatmap(
    year: int | None = Query(None, ge=2000, le=2100, description="Specific 4-digit calendar year"),
    start_date: date | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return await get_heatmap_grid(
        db=db,
        user_id=current_user.id,
        activity_id=None,
        start_date=start_date,
        end_date=end_date,
        year=year,
    )


@router.get(
    "/activity/{activity_id}",
    response_model=HeatmapGridResponse,
    summary="Get per-activity progression heatmap grid",
    description="Returns a continuous daily heatmap array (Levels 0-4) for a specific activity evaluated against its custom threshold config.",
)
async def get_activity_heatmap(
    activity_id: uuid.UUID,
    year: int | None = Query(None, ge=2000, le=2100, description="Specific 4-digit calendar year"),
    start_date: date | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return await get_heatmap_grid(
        db=db,
        user_id=current_user.id,
        activity_id=activity_id,
        start_date=start_date,
        end_date=end_date,
        year=year,
    )


@router.get(
    "/drilldown",
    response_model=HeatmapDrilldownResponse,
    summary="Get detailed drilldown metadata for a specific date",
    description="Returns all logged sessions, quantities, and completions for a given calendar date.",
)
async def get_drilldown_details(
    target_date: date = Query(..., alias="date", description="Target calendar date (YYYY-MM-DD)"),
    activity_id: uuid.UUID | None = Query(None, description="Optional activity filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return await get_day_drilldown(
        db=db,
        user_id=current_user.id,
        target_date=target_date,
        activity_id=activity_id,
    )


@router.post(
    "/rebuild",
    response_model=RebuildSummaryResponse,
    summary="Rebuild and recalculate daily summaries from raw sessions and logs",
    description="Aggregates raw immutable session and log records to synchronize daily summaries and streaks.",
)
async def rebuild_summaries(
    payload: RebuildSummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    count = await rebuild_daily_summaries(
        db=db,
        user_id=current_user.id,
        activity_id=payload.activity_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    return RebuildSummaryResponse(
        recalculated_days=count,
        message=f"Successfully synchronized {count} daily summaries and streak counters.",
    )

