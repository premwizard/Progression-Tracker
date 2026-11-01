import uuid
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activities.schemas import ActivityCreate, ActivityUpdate, TodayProgress
from app.models.activity import Activity, ActivityLog, ActivitySession
from app.models.summary import DailySummary, StreakRecord


async def get_today_progress_for_activity(
    db: AsyncSession, activity: Activity, user_id: uuid.UUID, target_date: date | None = None
) -> TodayProgress:
    """Compute today's accumulated duration, quantity, and completion status."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    # 1. Sum duration of completed sessions for target_date
    session_query = select(func.coalesce(func.sum(ActivitySession.duration_seconds), 0)).filter(
        ActivitySession.activity_id == activity.id,
        ActivitySession.user_id == user_id,
        ActivitySession.status == "completed",
        ActivitySession.deleted_at == None,
        func.date(ActivitySession.start_time) == target_date,
    )
    duration_res = await db.execute(session_query)
    total_duration = int(duration_res.scalar() or 0)

    # 2. Sum quantity logs for target_date
    quantity_query = select(func.coalesce(func.sum(ActivityLog.quantity_value), 0.0)).filter(
        ActivityLog.activity_id == activity.id,
        ActivityLog.user_id == user_id,
        ActivityLog.tracking_method == "quantity",
        ActivityLog.deleted_at == None,
        ActivityLog.log_date == target_date,
    )
    quantity_res = await db.execute(quantity_query)
    total_quantity = float(quantity_res.scalar() or 0.0)

    # 3. Check completion logs for target_date
    completion_query = select(ActivityLog).filter(
        ActivityLog.activity_id == activity.id,
        ActivityLog.user_id == user_id,
        ActivityLog.tracking_method == "completion",
        ActivityLog.is_completed == True,
        ActivityLog.deleted_at == None,
        ActivityLog.log_date == target_date,
    )
    completion_res = await db.execute(completion_query)
    is_completed = completion_res.scalars().first() is not None

    # 4. Calculate progress percentage against daily target
    progress_percent = 0.0
    if activity.daily_target and activity.daily_target > 0:
        if "time" in activity.tracking_methods:
            target_seconds = activity.daily_target * 60 if activity.metric_unit != "seconds" else activity.daily_target
            progress_percent = min(100.0, (total_duration / target_seconds) * 100.0)
        elif "quantity" in activity.tracking_methods:
            progress_percent = min(100.0, (total_quantity / activity.daily_target) * 100.0)
        elif "completion" in activity.tracking_methods:
            progress_percent = 100.0 if is_completed else 0.0
    elif is_completed:
        progress_percent = 100.0
    elif total_duration > 0 or total_quantity > 0:
        # If no explicit daily target, partial progress indicates effort
        progress_percent = 100.0

    return TodayProgress(
        duration_seconds=total_duration,
        quantity=total_quantity,
        completed=is_completed,
        progress_percent=round(progress_percent, 1),
    )


async def get_activity_streak(db: AsyncSession, activity_id: uuid.UUID, user_id: uuid.UUID) -> int:
    """Retrieve current streak count for an activity."""
    res = await db.execute(
        select(StreakRecord.current_streak).filter(
            StreakRecord.activity_id == activity_id,
            StreakRecord.user_id == user_id,
        )
    )
    return res.scalar() or 0


async def list_activities(
    db: AsyncSession,
    user_id: uuid.UUID,
    category: str | None = None,
    status: str | None = "active",
) -> list[dict[str, Any]]:
    """List all activities for a user with calculated today's progress and streaks."""
    query = select(Activity).filter(Activity.user_id == user_id, Activity.deleted_at == None)
    
    if category:
        query = query.filter(func.lower(Activity.category) == category.lower())
    if status:
        query = query.filter(Activity.status == status)

    query = query.order_by(Activity.created_at.desc())
    result = await db.execute(query)
    activities = result.scalars().all()

    today = datetime.now(timezone.utc).date()
    enriched_activities = []
    for act in activities:
        progress = await get_today_progress_for_activity(db, act, user_id, today)
        streak = await get_activity_streak(db, act.id, user_id)
        
        act_dict = {
            "id": act.id,
            "user_id": act.user_id,
            "name": act.name,
            "description": act.description,
            "icon": act.icon,
            "color": act.color,
            "category": act.category,
            "tracking_methods": act.tracking_methods,
            "metric_unit": act.metric_unit,
            "daily_target": act.daily_target,
            "weekly_target": act.weekly_target,
            "start_date": act.start_date,
            "end_date": act.end_date,
            "status": act.status,
            "heatmap_config": act.heatmap_config,
            "reminder_config": act.reminder_config,
            "archived_at": act.archived_at,
            "created_at": act.created_at,
            "updated_at": act.updated_at,
            "today_progress": progress,
            "current_streak": streak,
        }
        enriched_activities.append(act_dict)

    return enriched_activities


async def get_activity_by_id(
    db: AsyncSession, activity_id: uuid.UUID, user_id: uuid.UUID
) -> dict[str, Any] | None:
    """Retrieve single activity by ID with today's metrics."""
    result = await db.execute(
        select(Activity).filter(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.deleted_at == None,
        )
    )
    act = result.scalars().first()
    if not act:
        return None

    today = datetime.now(timezone.utc).date()
    progress = await get_today_progress_for_activity(db, act, user_id, today)
    streak = await get_activity_streak(db, act.id, user_id)

    return {
        "id": act.id,
        "user_id": act.user_id,
        "name": act.name,
        "description": act.description,
        "icon": act.icon,
        "color": act.color,
        "category": act.category,
        "tracking_methods": act.tracking_methods,
        "metric_unit": act.metric_unit,
        "daily_target": act.daily_target,
        "weekly_target": act.weekly_target,
        "start_date": act.start_date,
        "end_date": act.end_date,
        "status": act.status,
        "heatmap_config": act.heatmap_config,
        "reminder_config": act.reminder_config,
        "archived_at": act.archived_at,
        "created_at": act.created_at,
        "updated_at": act.updated_at,
        "today_progress": progress,
        "current_streak": streak,
    }


async def create_activity(
    db: AsyncSession, activity_in: ActivityCreate, user_id: uuid.UUID
) -> dict[str, Any]:
    """Create a new custom activity and initialize its streak record."""
    heatmap_cfg = activity_in.heatmap_config
    if not heatmap_cfg or not heatmap_cfg.get("levels"):
        # Default threshold generation based on target
        if "time" in activity_in.tracking_methods:
            target = activity_in.daily_target or 60.0
            heatmap_cfg = {
                "mode": "duration",
                "unit": activity_in.metric_unit or "minutes",
                "levels": {
                    "1": round(target * 0.25, 1),
                    "2": round(target * 0.50, 1),
                    "3": round(target * 0.75, 1),
                    "4": round(target * 1.00, 1),
                },
                "target_relative": False,
            }
        elif "quantity" in activity_in.tracking_methods:
            target = activity_in.daily_target or 10.0
            heatmap_cfg = {
                "mode": "quantity",
                "unit": activity_in.metric_unit or "units",
                "levels": {
                    "1": round(target * 0.25, 1),
                    "2": round(target * 0.50, 1),
                    "3": round(target * 0.75, 1),
                    "4": round(target * 1.00, 1),
                },
                "target_relative": False,
            }
        else:
            heatmap_cfg = {
                "mode": "target_percentage",
                "levels": {"1": 25.0, "2": 50.0, "3": 75.0, "4": 100.0},
                "target_relative": True,
            }

    db_activity = Activity(
        user_id=user_id,
        name=activity_in.name,
        description=activity_in.description,
        icon=activity_in.icon,
        color=activity_in.color,
        category=activity_in.category,
        tracking_methods=activity_in.tracking_methods,
        metric_unit=activity_in.metric_unit,
        daily_target=activity_in.daily_target,
        weekly_target=activity_in.weekly_target,
        start_date=activity_in.start_date,
        end_date=activity_in.end_date,
        status="active",
        heatmap_config=heatmap_cfg,
        reminder_config=activity_in.reminder_config,
    )
    db.add(db_activity)
    await db.flush()

    # Initialize streak record for activity
    streak_record = StreakRecord(
        user_id=user_id,
        activity_id=db_activity.id,
        current_streak=0,
        longest_streak=0,
        total_active_days=0,
    )
    db.add(streak_record)
    await db.commit()
    await db.refresh(db_activity)

    return await get_activity_by_id(db, db_activity.id, user_id)  # type: ignore


async def update_activity(
    db: AsyncSession, activity_id: uuid.UUID, activity_in: ActivityUpdate, user_id: uuid.UUID
) -> dict[str, Any] | None:
    """Update activity metadata, configuration, or status."""
    result = await db.execute(
        select(Activity).filter(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.deleted_at == None,
        )
    )
    db_activity = result.scalars().first()
    if not db_activity:
        return None

    update_dict = activity_in.model_dump(exclude_unset=True)
    if "status" in update_dict and update_dict["status"] == "archived":
        db_activity.archived_at = datetime.now(timezone.utc)
    elif "status" in update_dict and update_dict["status"] == "active":
        db_activity.archived_at = None

    for field, value in update_dict.items():
        setattr(db_activity, field, value)

    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)

    return await get_activity_by_id(db, db_activity.id, user_id)


async def delete_activity(db: AsyncSession, activity_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Soft delete an activity."""
    result = await db.execute(
        select(Activity).filter(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.deleted_at == None,
        )
    )
    db_activity = result.scalars().first()
    if not db_activity:
        return False

    now = datetime.now(timezone.utc)
    db_activity.deleted_at = now
    db.add(db_activity)
    await db.commit()
    return True

