from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_activity_and_tracking_lifecycle(client: AsyncClient):
    # 1. Authenticate / Login user
    register_payload = {
        "email": "athlete@example.com",
        "password": "securepassword123",
        "full_name": "Progression Athlete",
    }
    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code in [200, 201]

    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "athlete@example.com", "password": "securepassword123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Multi-Method Activity (Gym: Time + Quantity + Completion)
    gym_payload = {
        "name": "Gym Workout",
        "description": "Daily strength and conditioning",
        "icon": "dumbbell",
        "color": "#F97316",
        "category": "Fitness",
        "tracking_methods": ["time", "quantity", "completion"],
        "metric_unit": "pushups",
        "daily_target": 60.0,  # 60 minutes
        "heatmap_config": {
            "mode": "duration",
            "unit": "minutes",
            "levels": {"1": 15.0, "2": 30.0, "3": 45.0, "4": 60.0},
            "target_relative": False,
        },
    }
    create_act_res = await client.post("/api/v1/activities", json=gym_payload, headers=headers)
    assert create_act_res.status_code == 201
    gym_data = create_act_res.json()
    assert gym_data["name"] == "Gym Workout"
    assert gym_data["category"] == "Fitness"
    assert "time" in gym_data["tracking_methods"]
    gym_id = gym_data["id"]

    # 3. List activities and verify presence
    list_res = await client.get("/api/v1/activities", headers=headers)
    assert list_res.status_code == 200
    activities = list_res.json()
    assert any(a["id"] == gym_id for a in activities)

    # 4. Method 1: Time-Based Tracking (Start -> Pause -> Resume -> Finish)
    start_res = await client.post(
        "/api/v1/tracking/sessions/start",
        json={"activity_id": gym_id, "notes": "Legs & Core day"},
        headers=headers,
    )
    assert start_res.status_code == 201
    session = start_res.json()
    assert session["status"] == "running"
    session_id = session["id"]

    # Verify active session retrieval
    active_res = await client.get("/api/v1/tracking/sessions/active", headers=headers)
    assert active_res.status_code == 200
    assert active_res.json()["id"] == session_id

    # Pause session
    pause_res = await client.post(
        f"/api/v1/tracking/sessions/{session_id}/pause",
        json={"notes": "Water break"},
        headers=headers,
    )
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    # Resume session
    resume_res = await client.post(
        f"/api/v1/tracking/sessions/{session_id}/resume",
        headers=headers,
    )
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "running"

    # Finish session
    finish_res = await client.post(
        f"/api/v1/tracking/sessions/{session_id}/finish",
        json={"notes": "Completed squat sets"},
        headers=headers,
    )
    assert finish_res.status_code == 200
    finished_session = finish_res.json()
    assert finished_session["status"] == "completed"
    assert finished_session["end_time"] is not None

    # 5. Method 1 (Alternate): Manual Session Creation
    now = datetime.now(timezone.utc)
    manual_start = now - timedelta(minutes=45)
    manual_end = now
    manual_res = await client.post(
        "/api/v1/tracking/sessions/manual",
        json={
            "activity_id": gym_id,
            "start_time": manual_start.isoformat(),
            "end_time": manual_end.isoformat(),
            "notes": "Yesterday evening workout",
        },
        headers=headers,
    )
    assert manual_res.status_code == 201
    manual_data = manual_res.json()
    assert manual_data["duration_seconds"] == 45 * 60

    # 6. Method 2: Quantity-Based Tracking (Log Pushups)
    qty_res1 = await client.post(
        "/api/v1/tracking/quantity",
        json={
            "activity_id": gym_id,
            "quantity_value": 25.0,
            "notes": "Morning set",
        },
        headers=headers,
    )
    assert qty_res1.status_code == 201
    assert qty_res1.json()["quantity_value"] == 25.0

    qty_res2 = await client.post(
        "/api/v1/tracking/quantity",
        json={
            "activity_id": gym_id,
            "quantity_value": 30.0,
            "notes": "Evening set",
        },
        headers=headers,
    )
    assert qty_res2.status_code == 201
    assert qty_res2.json()["quantity_value"] == 30.0

    # 7. Method 3: Completion-Based Tracking (Toggle Complete)
    comp_res = await client.post(
        "/api/v1/tracking/completion",
        json={
            "activity_id": gym_id,
            "is_completed": True,
            "notes": "Daily workout goal met",
        },
        headers=headers,
    )
    assert comp_res.status_code == 201
    assert comp_res.json()["is_completed"] is True

    # 8. Method 4: Automatic Tracking (Screen Time Batch)
    screentime_res = await client.post(
        "/api/v1/tracking/screentime/batch",
        json={
            "items": [
                {
                    "package_name": "com.spotify.music",
                    "app_name": "Spotify",
                    "category": "entertainment",
                    "duration_minutes": 55,
                    "is_productive": False,
                },
                {
                    "package_name": "com.github.android",
                    "app_name": "GitHub",
                    "category": "productivity",
                    "duration_minutes": 40,
                    "is_productive": True,
                },
            ]
        },
        headers=headers,
    )
    assert screentime_res.status_code == 200
    assert len(screentime_res.json()) >= 2

    # Query screen time
    st_get_res = await client.get("/api/v1/tracking/screentime", headers=headers)
    assert st_get_res.status_code == 200
    st_records = st_get_res.json()
    assert any(r["package_name"] == "com.spotify.music" for r in st_records)

    # 9. Verify Activity Progress and Streak Recalculation
    check_act = await client.get(f"/api/v1/activities/{gym_id}", headers=headers)
    assert check_act.status_code == 200
    updated_act = check_act.json()
    
    # Verify quantity summed: 25 + 30 = 55
    assert updated_act["today_progress"]["quantity"] == 55.0
    # Verify completed is True
    assert updated_act["today_progress"]["completed"] is True
    # Verify current streak incremented
    assert updated_act["current_streak"] >= 1

