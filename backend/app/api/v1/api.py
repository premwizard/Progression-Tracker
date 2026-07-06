from fastapi import APIRouter

from app.api.v1.endpoints import health, goals
from app.goals import tasks_router
from app.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth_router.router, prefix="/auth", tags=["auth"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(tasks_router.router, prefix="/tasks", tags=["tasks"])
