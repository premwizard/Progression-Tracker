import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import delete, desc, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity, ActivityLog, ActivitySession
from app.models.summary import DailySummary, ScreenTimeLog, StreakRecord
from app.tracking.schemas import (
    ScreenTimeItem,
    SessionManualCreateRequest,
    SessionStartRequest,
)


# --- Intensity Level Computation ---

def calculate_intensity_level(
    activity: Activity,
    duration_seconds: int,
    quantity: float,
    is_completed: bool,
) -> int:
    """Calculate GitHub-style heatmap intensity level (0 to 4) based on activity's custom threshold config."""
    if duration_seconds <= 0 and quantity <= 0 and not is_completed:
        return 0

    cfg = activity.heatmap_config or {}
    mode = cfg.get("mode", "duration")
    levels = cfg.get("levels", {})
    l1 = float(levels.get("1", 15.0))
    l2 = float(levels.get("2", 30.0))
    l3 = float(levels.get("3", 45.0))
    l4 = float(levels.get("4", 60.0))
    target_relative = cfg.get("target_relative", False)

    # 1. Target-relative mode (e.g. percentage of daily target)
    if target_relative or mode == "target_percentage":
        if activity.daily_target and activity.daily_target > 0:
            if "time" in activity.tracking_methods:
                target_sec = activity.daily_target * 60 if activity.metric_unit != "seconds" else activity.daily_target
                val = (duration_seconds / target_sec) * 100.0
            elif "quantity" in activity.tracking_methods:
                val = (quantity / activity.daily_target) * 100.0
            else:
                val = 100.0 if is_completed else 0.0
        else:
            val = 100.0 if is_completed else (50.0 if (duration_seconds > 0 or quantity > 0) else 0.0)

        # Standard percentage thresholds: 25%, 50%, 75%, 100%
        if val >= 100.0:
            return 4
        if val >= 75.0:
            return 3
        if val >= 50.0:
            return 2
        if val >= 25.0:
            return 1
        return 1 if val > 0 else 0

    # 2. Quantity mode
    if mode == "quantity":
        val = quantity
        if val >= l4:
            return 4
        if val >= l3:
            return 3
        if val >= l2:
            return 2
        if val >= l1:
            return 1
        return 1 if val > 0 else 0

    # 3. Default: Duration mode (in minutes)
    minutes = duration_seconds / 60.0
    if minutes >= l4:
        return 4
    if minutes >= l3:
        return 3
    if minutes >= l2:
        return 2
    if minutes >= l1:
        return 1
    return 1 if minutes > 0 or is_completed else 0


# --- Daily Summary & Streak Recalculation ---

async def recalculate_daily_summary(
    db: AsyncSession,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
    target_date: date,
) -> DailySummary:
    """Aggregate raw sessions and logs for a date to produce or update the daily summary."""
    act_res = await db.execute(select(Activity).filter(Activity.id == activity_id))
    activity = act_res.scalars().first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # 1. Total session duration for target_date
    session_res = await db.execute(
        select(func.coalesce(func.sum(ActivitySession.duration_seconds), 0)).filter(
            ActivitySession.activity_id == activity_id,
            ActivitySession.user_id == user_id,
            ActivitySession.status == "completed",
            ActivitySession.deleted_at == None,
            func.date(ActivitySession.start_time) == target_date,
        )
    )
    total_duration = int(session_res.scalar() or 0)

    # 2. Total quantity for target_date
    qty_res = await db.execute(
        select(func.coalesce(func.sum(ActivityLog.quantity_value), 0.0)).filter(
            ActivityLog.activity_id == activity_id,
            ActivityLog.user_id == user_id,
            ActivityLog.tracking_method == "quantity",
            ActivityLog.deleted_at == None,
            ActivityLog.log_date == target_date,
        )
    )
    total_quantity = float(qty_res.scalar() or 0.0)

    # 3. Completion count
    comp_res = await db.execute(
        select(func.count(ActivityLog.id)).filter(
            ActivityLog.activity_id == activity_id,
            ActivityLog.user_id == user_id,
            ActivityLog.tracking_method == "completion",
            ActivityLog.is_completed == True,
            ActivityLog.deleted_at == None,
            ActivityLog.log_date == target_date,
        )
    )
    completions_count = int(comp_res.scalar() or 0)
    is_completed = completions_count > 0

    intensity = calculate_intensity_level(activity, total_duration, total_quantity, is_completed)

    # 4. Upsert activity-level daily summary
    stmt = insert(DailySummary).values(
        id=uuid.uuid4(),
        user_id=user_id,
        activity_id=activity_id,
        summary_date=target_date,
        total_duration_seconds=total_duration,
        total_quantity=total_quantity,
        completions_count=completions_count,
        intensity_level=intensity,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_user_activity_date_summary",
        set_={
            "total_duration_seconds": total_duration,
            "total_quantity": total_quantity,
            "completions_count": completions_count,
            "intensity_level": intensity,
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)

    # 5. Recompute overall user-level daily summary for this date
    all_summaries_res = await db.execute(
        select(DailySummary).filter(
            DailySummary.user_id == user_id,
            DailySummary.activity_id != None,
            DailySummary.summary_date == target_date,
        )
    )
    all_act_summaries = all_summaries_res.scalars().all()

    overall_duration = sum(s.total_duration_seconds for s in all_act_summaries)
    overall_quantity = sum(s.total_quantity for s in all_act_summaries)
    overall_completions = sum(s.completions_count for s in all_act_summaries)
    
    # Combined intensity is max of individual or calculated on total volume
    if not all_act_summaries:
        overall_intensity = 0
    else:
        active_counts = sum(1 for s in all_act_summaries if s.intensity_level > 0)
        max_sub_intensity = max(s.intensity_level for s in all_act_summaries)
        if active_counts >= 3 or overall_duration >= 7200:  # 2+ hours or 3+ activities
            overall_intensity = 4
        elif active_counts >= 2 or overall_duration >= 3600 or max_sub_intensity >= 3:
            overall_intensity = max(3, max_sub_intensity)
        elif active_counts >= 1 or overall_duration > 0 or overall_quantity > 0 or overall_completions > 0:
            overall_intensity = max(1, max_sub_intensity)
        else:
            overall_intensity = 0

    overall_stmt = insert(DailySummary).values(
        id=uuid.uuid4(),
        user_id=user_id,
        activity_id=None,
        summary_date=target_date,
        total_duration_seconds=overall_duration,
        total_quantity=overall_quantity,
        completions_count=overall_completions,
        intensity_level=overall_intensity,
    )
    overall_stmt = overall_stmt.on_conflict_do_update(
        constraint="uq_user_activity_date_summary",
        set_={
            "total_duration_seconds": overall_duration,
            "total_quantity": overall_quantity,
            "completions_count": overall_completions,
            "intensity_level": overall_intensity,
            "updated_at": func.now(),
        },
    )
    await db.execute(overall_stmt)
    await db.commit()

    # Retrieve and return updated summary
    res = await db.execute(
        select(DailySummary).filter(
            DailySummary.user_id == user_id,
            DailySummary.activity_id == activity_id,
            DailySummary.summary_date == target_date,
        )
    )
    return res.scalars().first()  # type: ignore


async def update_streak(
    db: AsyncSession,
    activity_id: uuid.UUID | None,
    user_id: uuid.UUID,
    active_date: date,
) -> StreakRecord:
    """Recalculate streak without destroying historical progress."""
    # Find all distinct active dates for this activity (or global if None)
    query = select(DailySummary.summary_date).filter(
        DailySummary.user_id == user_id,
        DailySummary.intensity_level > 0,
    )
    if activity_id is not None:
        query = query.filter(DailySummary.activity_id == activity_id)
    else:
        query = query.filter(DailySummary.activity_id == None)

    query = query.order_by(DailySummary.summary_date.desc())
    res = await db.execute(query)
    active_dates = set(res.scalars().all())

    total_active_days = len(active_dates)
    if not active_dates:
        current_streak = 0
        longest_streak = 0
        last_date = None
    else:
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        # Current streak calculation: check starting from today or yesterday
        streak_pointer = today if today in active_dates else (yesterday if yesterday in active_dates else None)
        current_streak = 0
        if streak_pointer:
            while streak_pointer in active_dates:
                current_streak += 1
                streak_pointer -= timedelta(days=1)

        # Longest streak calculation: iterate sorted dates
        sorted_dates = sorted(active_dates)
        longest_streak = 1 if sorted_dates else 0
        running = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
                running += 1
                if running > longest_streak:
                    longest_streak = running
            else:
                running = 1

        last_date = max(active_dates)

    # Upsert streak record
    stmt = insert(StreakRecord).values(
        id=uuid.uuid4(),
        user_id=user_id,
        activity_id=activity_id,
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_active_date=last_date,
        total_active_days=total_active_days,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_user_activity_streak",
        set_={
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_active_date": last_date,
            "total_active_days": total_active_days,
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)
    await db.commit()

    res = await db.execute(
        select(StreakRecord).filter(
            StreakRecord.user_id == user_id,
            StreakRecord.activity_id == activity_id,
        )
    )
    return res.scalars().first()  # type: ignore


# --- Method 1: Time-Based Tracking Engine ---

async def start_session(
    db: AsyncSession,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
    notes: str | None = None,
) -> ActivitySession:
    """Start an activity timer session. Prevents concurrent running sessions for the same activity."""
    # Check for existing running session for this activity
    existing = await db.execute(
        select(ActivitySession).filter(
            ActivitySession.activity_id == activity_id,
            ActivitySession.user_id == user_id,
            ActivitySession.status.in_(["running", "paused"]),
            ActivitySession.deleted_at == None,
        )
    )
    active_session = existing.scalars().first()
    if active_session:
        return active_session  # Return existing running session idempotently

    now = datetime.now(timezone.utc)
    session = ActivitySession(
        activity_id=activity_id,
        user_id=user_id,
        start_time=now,
        status="running",
        paused_duration_seconds=0,
        duration_seconds=0,
        pause_intervals=[],
        notes=notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def pause_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    notes: str | None = None,
) -> ActivitySession:
    """Pause an active session, recording the pause timestamp interval."""
    res = await db.execute(
        select(ActivitySession).filter(
            ActivitySession.id == session_id,
            ActivitySession.user_id == user_id,
            ActivitySession.deleted_at == None,
        )
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "running":
        return session

    now = datetime.now(timezone.utc)
    intervals = list(session.pause_intervals or [])
    intervals.append({"pause_start": now.isoformat(), "pause_end": None})

    session.pause_intervals = intervals
    session.status = "paused"
    if notes:
        session.notes = notes

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def resume_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ActivitySession:
    """Resume a paused session, closing the last open pause interval."""
    res = await db.execute(
        select(ActivitySession).filter(
            ActivitySession.id == session_id,
            ActivitySession.user_id == user_id,
            ActivitySession.deleted_at == None,
        )
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "paused":
        return session

    now = datetime.now(timezone.utc)
    intervals = list(session.pause_intervals or [])
    added_pause_seconds = 0

    if intervals and intervals[-1].get("pause_end") is None:
        pause_start_str = intervals[-1]["pause_start"]
        pause_start = datetime.fromisoformat(pause_start_str)
        if pause_start.tzinfo is None:
            pause_start = pause_start.replace(tzinfo=timezone.utc)
        
        pause_delta = max(0, int((now - pause_start).total_seconds()))
        intervals[-1]["pause_end"] = now.isoformat()
        intervals[-1]["duration_seconds"] = pause_delta
        added_pause_seconds = pause_delta

    session.pause_intervals = intervals
    session.paused_duration_seconds += added_pause_seconds
    session.status = "running"

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def finish_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    notes: str | None = None,
) -> ActivitySession:
    """Finish session and compute duration mathematically from timestamps."""
    res = await db.execute(
        select(ActivitySession).filter(
            ActivitySession.id == session_id,
            ActivitySession.user_id == user_id,
            ActivitySession.deleted_at == None,
        )
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        return session

    now = datetime.now(timezone.utc)
    intervals = list(session.pause_intervals or [])

    # If it was paused when finished, close the open interval
    if session.status == "paused" and intervals and intervals[-1].get("pause_end") is None:
        pause_start_str = intervals[-1]["pause_start"]
        pause_start = datetime.fromisoformat(pause_start_str)
        if pause_start.tzinfo is None:
            pause_start = pause_start.replace(tzinfo=timezone.utc)
        pause_delta = max(0, int((now - pause_start).total_seconds()))
        intervals[-1]["pause_end"] = now.isoformat()
        intervals[-1]["duration_seconds"] = pause_delta
        session.paused_duration_seconds += pause_delta
        session.pause_intervals = intervals

    session.end_time = now
    
    # Exact timestamp-based calculation:
    total_elapsed = int((session.end_time - session.start_time).total_seconds())
    session.duration_seconds = max(0, total_elapsed - session.paused_duration_seconds)
    session.status = "completed"
    if notes:
        session.notes = notes

    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Trigger daily summary recalculation and streak update
    log_date = session.start_time.date()
    await recalculate_daily_summary(db, session.activity_id, user_id, log_date)
    await update_streak(db, session.activity_id, user_id, log_date)
    await update_streak(db, None, user_id, log_date)

    return session


async def cancel_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ActivitySession:
    """Cancel an active session without contributing to progression."""
    res = await db.execute(
        select(ActivitySession).filter(
            ActivitySession.id == session_id,
            ActivitySession.user_id == user_id,
            ActivitySession.deleted_at == None,
        )
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "cancelled"
    session.end_time = datetime.now(timezone.utc)
    session.duration_seconds = 0
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def manual_add_session(
    db: AsyncSession,
    manual_in: SessionManualCreateRequest,
    user_id: uuid.UUID,
) -> ActivitySession:
    """Allow user to manually record a completed session if they forgot to run the timer."""
    start = manual_in.start_time
    end = manual_in.end_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    if end < start:
        raise HTTPException(status_code=400, detail="End time cannot be earlier than start time")

    duration = int((end - start).total_seconds())

    session = ActivitySession(
        activity_id=manual_in.activity_id,
        user_id=user_id,
        start_time=start,
        end_time=end,
        duration_seconds=duration,
        paused_duration_seconds=0,
        status="completed",
        notes=manual_in.notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    log_date = start.date()
    await recalculate_daily_summary(db, manual_in.activity_id, user_id, log_date)
    await update_streak(db, manual_in.activity_id, user_id, log_date)
    await update_streak(db, None, user_id, log_date)

    return session


async def get_active_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    activity_id: uuid.UUID | None = None,
) -> ActivitySession | None:
    """Get the currently running or paused session for live timer resumption."""
    query = select(ActivitySession).filter(
        ActivitySession.user_id == user_id,
        ActivitySession.status.in_(["running", "paused"]),
        ActivitySession.deleted_at == None,
    )
    if activity_id is not None:
        query = query.filter(ActivitySession.activity_id == activity_id)

    query = query.order_by(ActivitySession.start_time.desc())
    res = await db.execute(query)
    return res.scalars().first()


async def list_sessions(
    db: AsyncSession,
    user_id: uuid.UUID,
    activity_id: uuid.UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[ActivitySession]:
    """Retrieve historical sessions."""
    query = select(ActivitySession).filter(
        ActivitySession.user_id == user_id,
        ActivitySession.deleted_at == None,
    )
    if activity_id is not None:
        query = query.filter(ActivitySession.activity_id == activity_id)

    query = query.order_by(ActivitySession.start_time.desc()).limit(limit).offset(offset)
    res = await db.execute(query)
    return list(res.scalars().all())


# --- Method 2: Quantity-Based Tracking Engine ---

async def log_quantity(
    db: AsyncSession,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
    quantity_value: float,
    log_date: date | None = None,
    notes: str | None = None,
) -> ActivityLog:
    """Log incremental quantity (e.g. +10 pushups, +5 pages, +2 problems)."""
    if log_date is None:
        log_date = datetime.now(timezone.utc).date()

    log_entry = ActivityLog(
        activity_id=activity_id,
        user_id=user_id,
        log_date=log_date,
        tracking_method="quantity",
        quantity_value=quantity_value,
        notes=notes,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    # Recalculate daily summary & streak
    await recalculate_daily_summary(db, activity_id, user_id, log_date)
    await update_streak(db, activity_id, user_id, log_date)
    await update_streak(db, None, user_id, log_date)

    return log_entry


# --- Method 3: Completion-Based Tracking Engine ---

async def set_completion(
    db: AsyncSession,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
    is_completed: bool,
    log_date: date | None = None,
    notes: str | None = None,
) -> ActivityLog:
    """Mark daily activity as completed or undo completion."""
    if log_date is None:
        log_date = datetime.now(timezone.utc).date()

    # Check if a completion record already exists for this date
    res = await db.execute(
        select(ActivityLog).filter(
            ActivityLog.activity_id == activity_id,
            ActivityLog.user_id == user_id,
            ActivityLog.tracking_method == "completion",
            ActivityLog.log_date == log_date,
            ActivityLog.deleted_at == None,
        )
    )
    existing_log = res.scalars().first()

    if existing_log:
        existing_log.is_completed = is_completed
        if notes:
            existing_log.notes = notes
        db.add(existing_log)
        await db.commit()
        await db.refresh(existing_log)
        ret_log = existing_log
    else:
        new_log = ActivityLog(
            activity_id=activity_id,
            user_id=user_id,
            log_date=log_date,
            tracking_method="completion",
            is_completed=is_completed,
            notes=notes,
        )
        db.add(new_log)
        await db.commit()
        await db.refresh(new_log)
        ret_log = new_log

    # Recalculate daily summary & streak
    await recalculate_daily_summary(db, activity_id, user_id, log_date)
    await update_streak(db, activity_id, user_id, log_date)
    await update_streak(db, None, user_id, log_date)

    return ret_log


# --- Method 4: Automatic Tracking (Screen Time) ---

async def record_screen_time_batch(
    db: AsyncSession,
    user_id: uuid.UUID,
    items: list[ScreenTimeItem],
) -> list[ScreenTimeLog]:
    """Record batch of screen time data reported by mobile Android client."""
    records = []
    for item in items:
        stmt = insert(ScreenTimeLog).values(
            id=uuid.uuid4(),
            user_id=user_id,
            log_date=item.log_date,
            package_name=item.package_name,
            app_name=item.app_name,
            category=item.category,
            duration_minutes=item.duration_minutes,
            is_productive=item.is_productive,
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_user_date_package_screentime",
            set_={
                "duration_minutes": item.duration_minutes,
                "is_productive": item.is_productive,
                "category": item.category,
                "app_name": item.app_name,
                "updated_at": func.now(),
            },
        )
        await db.execute(stmt)

    await db.commit()

    # Query latest records for the dates in batch
    dates = list({item.log_date for item in items})
    res = await db.execute(
        select(ScreenTimeLog).filter(
            ScreenTimeLog.user_id == user_id,
            ScreenTimeLog.log_date.in_(dates),
        )
    )
    return list(res.scalars().all())

