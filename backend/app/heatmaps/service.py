import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.heatmaps.schemas import (
    DayActivityDrilldown,
    DayLogDrilldown,
    DaySessionDrilldown,
    HeatmapActivityInfo,
    HeatmapDayCell,
    HeatmapDrilldownResponse,
    HeatmapGridResponse,
)
from app.models.activity import Activity, ActivityLog, ActivitySession
from app.models.summary import DailySummary, StreakRecord
from app.tracking.service import (
    calculate_intensity_level,
    recalculate_daily_summary,
    update_streak,
)


def _resolve_date_range(
    year: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[date, date]:
    """Resolve query parameters into an exact [start_date, end_date] date range."""
    today = date.today()
    if year is not None:
        return date(year, 1, 1), date(year, 12, 31)

    if start_date is not None and end_date is not None:
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be less than or equal to end_date",
            )
        return start_date, end_date

    if start_date is not None:
        return start_date, max(start_date, today)

    if end_date is not None:
        return end_date - timedelta(days=364), end_date

    # Default to past 365 days ending today
    return today - timedelta(days=364), today


def _calculate_streaks_from_cells(
    cells: list[HeatmapDayCell], today: date
) -> tuple[int, int]:
    """Calculate (current_streak, longest_streak) from an ordered chronological list of day cells."""
    longest_streak = 0
    temp_streak = 0
    date_to_active = {c.date: c.is_active for c in cells}

    for cell in cells:
        if cell.is_active:
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        else:
            temp_streak = 0

    # Calculate current streak ending today or yesterday
    current_streak = 0
    yesterday = today - timedelta(days=1)
    check_date = today

    if not date_to_active.get(today, False) and date_to_active.get(yesterday, False):
        check_date = yesterday

    while date_to_active.get(check_date, False):
        current_streak += 1
        check_date -= timedelta(days=1)

    return current_streak, longest_streak


async def get_heatmap_grid(
    db: AsyncSession,
    user_id: uuid.UUID,
    activity_id: uuid.UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    year: int | None = None,
) -> HeatmapGridResponse:
    """Retrieve an unbroken daily heatmap grid for either overall user progression or a specific activity."""
    range_start, range_end = _resolve_date_range(year=year, start_date=start_date, end_date=end_date)
    today = date.today()

    activity_info: HeatmapActivityInfo | None = None
    if activity_id is not None:
        act_res = await db.execute(
            select(Activity).filter(
                Activity.id == activity_id,
                Activity.user_id == user_id,
                Activity.deleted_at.is_(None),
            )
        )
        activity = act_res.scalars().first()
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity with ID {activity_id} not found",
            )
        activity_info = HeatmapActivityInfo(
            id=activity.id,
            name=activity.name,
            color=activity.color,
            icon=activity.icon,
            category=activity.category,
            metric_unit=activity.metric_unit,
            daily_target=activity.daily_target,
            tracking_methods=activity.tracking_methods or [],
            heatmap_config=activity.heatmap_config or {},
        )

    # Query existing DailySummary records within the range
    query = select(DailySummary).filter(
        DailySummary.user_id == user_id,
        DailySummary.summary_date.between(range_start, range_end),
    )
    if activity_id is not None:
        query = query.filter(DailySummary.activity_id == activity_id)
    else:
        query = query.filter(DailySummary.activity_id.is_(None))

    summaries_res = await db.execute(query)
    summaries = summaries_res.scalars().all()
    summary_map: dict[date, DailySummary] = {s.summary_date: s for s in summaries}

    # Fetch stored streak record if available
    streak_query = select(StreakRecord).filter(
        StreakRecord.user_id == user_id,
    )
    if activity_id is not None:
        streak_query = streak_query.filter(StreakRecord.activity_id == activity_id)
    else:
        streak_query = streak_query.filter(StreakRecord.activity_id.is_(None))

    streak_res = await db.execute(streak_query)
    streak_record = streak_res.scalars().first()

    # Generate complete day-by-day sequence
    cells: list[HeatmapDayCell] = []
    level_counts = {"0": 0, "1": 0, "2": 0, "3": 0, "4": 0}
    total_duration = 0
    total_qty = 0.0
    total_comps = 0
    active_days_count = 0

    curr_date = range_start
    while curr_date <= range_end:
        summary = summary_map.get(curr_date)
        if summary:
            level = max(0, min(4, summary.intensity_level))
            dur = summary.total_duration_seconds
            qty = summary.total_quantity
            comp = summary.completions_count
            is_active = level > 0 or dur > 0 or qty > 0 or comp > 0
        else:
            level = 0
            dur = 0
            qty = 0.0
            comp = 0
            is_active = False

        cell = HeatmapDayCell(
            date=curr_date,
            intensity_level=level,
            total_duration_seconds=dur,
            total_quantity=qty,
            completions_count=comp,
            is_active=is_active,
        )
        cells.append(cell)

        # Aggregate stats
        level_counts[str(level)] += 1
        total_duration += dur
        total_qty += qty
        total_comps += comp
        if is_active:
            active_days_count += 1

        curr_date += timedelta(days=1)

    total_days = len(cells)
    consistency_pct = (
        round((active_days_count / total_days) * 100.0, 1) if total_days > 0 else 0.0
    )

    # Calculate streaks
    calc_curr, calc_longest = _calculate_streaks_from_cells(cells, today)
    if streak_record:
        current_streak = max(streak_record.current_streak, calc_curr)
        longest_streak = max(streak_record.longest_streak, calc_longest)
    else:
        current_streak = calc_curr
        longest_streak = calc_longest

    return HeatmapGridResponse(
        start_date=range_start,
        end_date=range_end,
        total_days=total_days,
        active_days=active_days_count,
        consistency_percentage=consistency_pct,
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_duration_seconds=total_duration,
        total_quantity=round(total_qty, 2),
        total_completions=total_comps,
        activity=activity_info,
        level_counts=level_counts,
        cells=cells,
    )


async def get_day_drilldown(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    activity_id: uuid.UUID | None = None,
) -> HeatmapDrilldownResponse:
    """Retrieve detailed session, log, and breakdown metadata for a specific calendar date."""
    # 1. Fetch relevant activities
    act_query = select(Activity).filter(
        Activity.user_id == user_id,
        Activity.deleted_at.is_(None),
    )
    if activity_id is not None:
        act_query = act_query.filter(Activity.id == activity_id)

    act_res = await db.execute(act_query)
    activities = act_res.scalars().all()
    act_dict = {a.id: a for a in activities}

    # 2. Fetch sessions for target_date
    session_query = select(ActivitySession).filter(
        ActivitySession.user_id == user_id,
        ActivitySession.deleted_at.is_(None),
        func.date(ActivitySession.start_time) == target_date,
    )
    if activity_id is not None:
        session_query = session_query.filter(ActivitySession.activity_id == activity_id)
    session_query = session_query.order_by(ActivitySession.start_time.asc())

    sessions_res = await db.execute(session_query)
    sessions = sessions_res.scalars().all()

    # 3. Fetch logs for target_date
    log_query = select(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.deleted_at.is_(None),
        ActivityLog.log_date == target_date,
    )
    if activity_id is not None:
        log_query = log_query.filter(ActivityLog.activity_id == activity_id)
    log_query = log_query.order_by(ActivityLog.created_at.asc())

    logs_res = await db.execute(log_query)
    logs = logs_res.scalars().all()

    # Group sessions and logs by activity
    activity_sessions: dict[uuid.UUID, list[ActivitySession]] = {}
    for s in sessions:
        activity_sessions.setdefault(s.activity_id, []).append(s)

    activity_logs: dict[uuid.UUID, list[ActivityLog]] = {}
    for l in logs:
        activity_logs.setdefault(l.activity_id, []).append(l)

    # Collect unique activity IDs active on this day
    active_act_ids = set(activity_sessions.keys()) | set(activity_logs.keys())

    # If an activity_id was specifically requested and had no sessions/logs, include it anyway
    if activity_id is not None and activity_id in act_dict:
        active_act_ids.add(activity_id)

    activities_drilldown: list[DayActivityDrilldown] = []
    overall_duration = 0
    overall_qty = 0.0
    overall_comps = 0

    for aid in active_act_ids:
        act = act_dict.get(aid)
        if not act:
            continue

        act_sess_list = activity_sessions.get(aid, [])
        act_logs_list = activity_logs.get(aid, [])

        dur = sum(s.duration_seconds for s in act_sess_list if s.status == "completed")
        qty = sum(l.quantity_value or 0.0 for l in act_logs_list if l.tracking_method == "quantity")
        comps = sum(1 for l in act_logs_list if l.tracking_method == "completion" and l.is_completed)
        is_completed = comps > 0

        overall_duration += dur
        overall_qty += qty
        overall_comps += comps

        intensity = calculate_intensity_level(act, dur, qty, is_completed)

        sess_drilldowns = [
            DaySessionDrilldown(
                id=s.id,
                start_time=s.start_time,
                end_time=s.end_time,
                duration_seconds=s.duration_seconds,
                status=s.status,
                notes=s.notes,
            )
            for s in act_sess_list
        ]

        log_drilldowns = [
            DayLogDrilldown(
                id=l.id,
                tracking_method=l.tracking_method,
                quantity_value=l.quantity_value,
                is_completed=l.is_completed,
                notes=l.notes,
            )
            for l in act_logs_list
        ]

        activities_drilldown.append(
            DayActivityDrilldown(
                activity_id=act.id,
                activity_name=act.name,
                activity_color=act.color,
                activity_icon=act.icon,
                activity_category=act.category,
                metric_unit=act.metric_unit,
                total_duration_seconds=dur,
                total_quantity=round(qty, 2),
                is_completed=is_completed,
                intensity_level=intensity,
                sessions=sess_drilldowns,
                logs=log_drilldowns,
            )
        )

    # Sort drilldown activities by intensity desc, then duration desc
    activities_drilldown.sort(
        key=lambda a: (a.intensity_level, a.total_duration_seconds), reverse=True
    )

    # Calculate overall intensity
    # Fetch DailySummary if exists, otherwise compute dynamically
    summary_res = await db.execute(
        select(DailySummary).filter(
            DailySummary.user_id == user_id,
            DailySummary.activity_id.is_(None),
            DailySummary.summary_date == target_date,
        )
    )
    overall_summary = summary_res.scalars().first()
    if overall_summary:
        overall_intensity = overall_summary.intensity_level
    else:
        if not activities_drilldown:
            overall_intensity = 0
        else:
            max_intensity = max(a.intensity_level for a in activities_drilldown)
            active_count = sum(1 for a in activities_drilldown if a.intensity_level > 0)
            if active_count >= 3 or overall_duration >= 7200:
                overall_intensity = 4
            elif active_count >= 2 or overall_duration >= 3600 or max_intensity >= 3:
                overall_intensity = max(3, max_intensity)
            elif active_count >= 1 or overall_duration > 0 or overall_qty > 0 or overall_comps > 0:
                overall_intensity = max(1, max_intensity)
            else:
                overall_intensity = 0

    return HeatmapDrilldownResponse(
        target_date=target_date,
        overall_intensity=overall_intensity,
        total_duration_seconds=overall_duration,
        total_quantity=round(overall_qty, 2),
        total_completions=overall_comps,
        activities=activities_drilldown,
    )


async def rebuild_daily_summaries(
    db: AsyncSession,
    user_id: uuid.UUID,
    activity_id: uuid.UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    """Rebuild all DailySummary records and StreakRecords from raw sessions and logs."""
    # 1. Fetch relevant activities
    act_query = select(Activity).filter(
        Activity.user_id == user_id,
        Activity.deleted_at.is_(None),
    )
    if activity_id is not None:
        act_query = act_query.filter(Activity.id == activity_id)

    act_res = await db.execute(act_query)
    activities = act_res.scalars().all()
    if not activities:
        return 0

    act_ids = [a.id for a in activities]

    # 2. Find all distinct dates with sessions
    sess_date_query = select(distinct(func.date(ActivitySession.start_time))).filter(
        ActivitySession.user_id == user_id,
        ActivitySession.activity_id.in_(act_ids),
        ActivitySession.deleted_at.is_(None),
    )
    if start_date is not None:
        sess_date_query = sess_date_query.filter(func.date(ActivitySession.start_time) >= start_date)
    if end_date is not None:
        sess_date_query = sess_date_query.filter(func.date(ActivitySession.start_time) <= end_date)

    sess_dates_res = await db.execute(sess_date_query)
    session_dates = {d for (d,) in sess_dates_res.all() if d is not None}

    # 3. Find all distinct dates with logs
    log_date_query = select(distinct(ActivityLog.log_date)).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.activity_id.in_(act_ids),
        ActivityLog.deleted_at.is_(None),
    )
    if start_date is not None:
        log_date_query = log_date_query.filter(ActivityLog.log_date >= start_date)
    if end_date is not None:
        log_date_query = log_date_query.filter(ActivityLog.log_date <= end_date)

    log_dates_res = await db.execute(log_date_query)
    log_dates = {d for (d,) in log_dates_res.all() if d is not None}

    all_dates = sorted(session_dates | log_dates)

    # 4. Recompute daily summaries for each activity and date
    recalculated_count = 0
    for target_date in all_dates:
        for act in activities:
            await recalculate_daily_summary(db, act.id, user_id, target_date)
            recalculated_count += 1

    # 5. Recompute streaks
    latest_active_date = all_dates[-1] if all_dates else date.today()
    for act in activities:
        await update_streak(db, act.id, user_id, latest_active_date)
    await update_streak(db, None, user_id, latest_active_date)

    await db.commit()
    return len(all_dates)
