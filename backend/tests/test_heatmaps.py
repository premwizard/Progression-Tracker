import uuid
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_heatmap_engine_overall_and_activity(client: AsyncClient):
    # 1. Register and authenticate user
    user_email = f"heatmap_user_{uuid.uuid4().hex[:6]}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": user_email, "password": "securepassword123", "full_name": "Heatmap Tester"},
    )
    assert reg_res.status_code in [200, 201]

    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": user_email, "password": "securepassword123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test overall heatmap on fresh user with no logs (should return 365 unbroken level 0 cells)
    overall_empty_res = await client.get("/api/v1/heatmaps/overall", headers=headers)
    assert overall_empty_res.status_code == 200
    grid_empty = overall_empty_res.json()
    assert grid_empty["total_days"] == 365
    assert grid_empty["active_days"] == 0
    assert grid_empty["current_streak"] == 0
    assert grid_empty["longest_streak"] == 0
    assert grid_empty["consistency_percentage"] == 0.0
    assert len(grid_empty["cells"]) == 365
    assert grid_empty["level_counts"]["0"] == 365
    assert grid_empty["level_counts"]["4"] == 0

    # 3. Create Activity 1: Coding (Duration-based heatmap: 15m -> L1, 30m -> L2, 45m -> L3, 60m -> L4)
    code_act_res = await client.post(
        "/api/v1/activities",
        json={
            "name": "System Coding",
            "description": "Backend and frontend architecture",
            "icon": "code",
            "color": "#3B82F6",
            "category": "Projects",
            "tracking_methods": ["time"],
            "metric_unit": "minutes",
            "daily_target": 60.0,
            "heatmap_config": {
                "mode": "duration",
                "unit": "minutes",
                "levels": {"1": 15.0, "2": 30.0, "3": 45.0, "4": 60.0},
                "target_relative": False,
            },
        },
        headers=headers,
    )
    assert code_act_res.status_code == 201
    code_id = code_act_res.json()["id"]

    # 4. Create Activity 2: Pushups (Quantity-based target relative: target 50 reps)
    pushups_act_res = await client.post(
        "/api/v1/activities",
        json={
            "name": "Daily Pushups",
            "description": "Strength endurance",
            "icon": "activity",
            "color": "#10B981",
            "category": "Fitness",
            "tracking_methods": ["quantity"],
            "metric_unit": "reps",
            "daily_target": 50.0,
            "heatmap_config": {
                "mode": "target_percentage",
                "target_relative": True,
            },
        },
        headers=headers,
    )
    assert pushups_act_res.status_code == 201
    pushups_id = pushups_act_res.json()["id"]

    today = date.today()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    # 5. Log activity sessions and quantities across the last 3 days
    # Two days ago: 20 mins coding (Level 1)
    two_days_ago_start = datetime.now(timezone.utc) - timedelta(days=2, minutes=20)
    two_days_ago_end = datetime.now(timezone.utc) - timedelta(days=2)
    sess_2d = await client.post(
        "/api/v1/tracking/sessions/manual",
        json={
            "activity_id": code_id,
            "start_time": two_days_ago_start.isoformat(),
            "end_time": two_days_ago_end.isoformat(),
            "notes": "Code refactoring two days ago",
        },
        headers=headers,
    )
    assert sess_2d.status_code == 201

    # Yesterday: 60 mins coding (Level 4) + 25 pushups (50% target -> Level 2)
    yesterday_start = datetime.now(timezone.utc) - timedelta(days=1, hours=1)
    yesterday_end = datetime.now(timezone.utc) - timedelta(days=1)
    sess_1d = await client.post(
        "/api/v1/tracking/sessions/manual",
        json={
            "activity_id": code_id,
            "start_time": yesterday_start.isoformat(),
            "end_time": yesterday_end.isoformat(),
            "notes": "Full feature implementation yesterday",
        },
        headers=headers,
    )
    assert sess_1d.status_code == 201

    log_1d = await client.post(
        "/api/v1/tracking/quantity",
        json={
            "activity_id": pushups_id,
            "quantity_value": 25.0,  # 25/50 = 50% -> Level 2
            "log_date": yesterday.isoformat(),
            "notes": "Morning set of 25",
        },
        headers=headers,
    )
    assert log_1d.status_code == 201

    # Today: 50 pushups (100% target -> Level 4)
    log_today = await client.post(
        "/api/v1/tracking/quantity",
        json={
            "activity_id": pushups_id,
            "quantity_value": 50.0,
            "log_date": today.isoformat(),
            "notes": "Hit daily 50 target",
        },
        headers=headers,
    )
    assert log_today.status_code == 201

    # 6. Verify Per-Activity Heatmap for Coding
    code_heatmap_res = await client.get(
        f"/api/v1/heatmaps/activity/{code_id}?start_date={two_days_ago.isoformat()}&end_date={today.isoformat()}",
        headers=headers,
    )
    assert code_heatmap_res.status_code == 200
    code_heatmap = code_heatmap_res.json()
    assert code_heatmap["activity"]["name"] == "System Coding"
    assert code_heatmap["total_days"] == 3
    assert code_heatmap["active_days"] == 2  # 2 days ago and yesterday
    assert code_heatmap["total_duration_seconds"] == 4800  # 1200 + 3600

    code_cells = {c["date"]: c for c in code_heatmap["cells"]}
    assert code_cells[two_days_ago.isoformat()]["intensity_level"] == 1
    assert code_cells[yesterday.isoformat()]["intensity_level"] == 4
    assert code_cells[today.isoformat()]["intensity_level"] == 0

    # 7. Verify Per-Activity Heatmap for Pushups
    pushups_heatmap_res = await client.get(
        f"/api/v1/heatmaps/activity/{pushups_id}?start_date={two_days_ago.isoformat()}&end_date={today.isoformat()}",
        headers=headers,
    )
    assert pushups_heatmap_res.status_code == 200
    pushups_heatmap = pushups_heatmap_res.json()
    assert pushups_heatmap["activity"]["name"] == "Daily Pushups"
    assert pushups_heatmap["total_quantity"] == 75.0  # 25 + 50
    pushups_cells = {c["date"]: c for c in pushups_heatmap["cells"]}
    assert pushups_cells[two_days_ago.isoformat()]["intensity_level"] == 0
    assert pushups_cells[yesterday.isoformat()]["intensity_level"] == 2
    assert pushups_cells[today.isoformat()]["intensity_level"] == 4

    # 8. Verify Overall Heatmap (Aggregated Across All Endeavors)
    overall_res = await client.get(
        f"/api/v1/heatmaps/overall?start_date={two_days_ago.isoformat()}&end_date={today.isoformat()}",
        headers=headers,
    )
    assert overall_res.status_code == 200
    overall_grid = overall_res.json()
    assert overall_grid["activity"] is None
    assert overall_grid["total_days"] == 3
    assert overall_grid["active_days"] == 3
    assert overall_grid["current_streak"] == 3
    assert overall_grid["longest_streak"] == 3
    assert overall_grid["consistency_percentage"] == 100.0

    # 9. Verify Drilldown Endpoint for yesterday
    drilldown_res = await client.get(
        f"/api/v1/heatmaps/drilldown?date={yesterday.isoformat()}",
        headers=headers,
    )
    assert drilldown_res.status_code == 200
    drilldown = drilldown_res.json()
    assert drilldown["target_date"] == yesterday.isoformat()
    assert drilldown["overall_intensity"] >= 3
    assert drilldown["total_duration_seconds"] == 3600
    assert drilldown["total_quantity"] == 25.0
    act_names = [a["activity_name"] for a in drilldown["activities"]]
    assert "System Coding" in act_names
    assert "Daily Pushups" in act_names

    # Check session note in drilldown
    coding_drill = next(a for a in drilldown["activities"] if a["activity_name"] == "System Coding")
    assert len(coding_drill["sessions"]) == 1
    assert coding_drill["sessions"][0]["notes"] == "Full feature implementation yesterday"

    # 10. Test Rebuild Endpoint
    rebuild_res = await client.post(
        "/api/v1/heatmaps/rebuild",
        json={"start_date": two_days_ago.isoformat(), "end_date": today.isoformat()},
        headers=headers,
    )
    assert rebuild_res.status_code == 200
    rebuild_data = rebuild_res.json()
    assert rebuild_data["recalculated_days"] >= 3
