import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "reachable"
    assert data["redis"] == "reachable"

@pytest.mark.asyncio
async def test_auth_and_goals_flow(client: AsyncClient):
    # 1. Register User
    register_payload = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User"
    }
    register_response = await client.post("/api/v1/auth/register", json=register_payload)
    assert register_response.status_code == 200
    user_data = register_response.json()
    assert user_data["email"] == "testuser@example.com"
    
    # 2. Login User
    login_payload = {
        "username": "testuser@example.com",
        "password": "strongpassword123"
    }
    login_response = await client.post("/api/v1/auth/login", data=login_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Read profile details
    me_response = await client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "testuser@example.com"
    
    # 4. Create Goal
    goal_payload = {
        "title": "Master Programming",
        "description": "Learn advanced design principles"
    }
    goal_response = await client.post("/api/v1/goals", json=goal_payload, headers=headers)
    assert goal_response.status_code == 201
    goal_data = goal_response.json()
    assert goal_data["title"] == "Master Programming"
    goal_id = goal_data["id"]
    
    # 5. Create Task under Goal
    task_payload = {
        "title": "Read clean architecture book",
        "description": "Focus on separation of concerns",
        "priority": "high"
    }
    task_response = await client.post(f"/api/v1/goals/{goal_id}/tasks", json=task_payload, headers=headers)
    assert task_response.status_code == 201
    task_data = task_response.json()
    assert task_data["title"] == "Read clean architecture book"
    task_id = task_data["id"]
    
    # Verify progress is initially 0
    goal_response_2 = await client.get(f"/api/v1/goals/{goal_id}", headers=headers)
    assert goal_response_2.json()["progress"] == 0.0
    
    # 6. Complete Task
    update_task_payload = {
        "status": "completed"
    }
    update_task_response = await client.put(f"/api/v1/goals/{goal_id}/tasks/{task_id}", json=update_task_payload, headers=headers)
    assert update_task_response.status_code == 200
    
    # Verify parent progress automatically recalculated to 100%
    goal_response_3 = await client.get(f"/api/v1/goals/{goal_id}", headers=headers)
    assert goal_response_3.json()["progress"] == 100.0
