from fastapi import APIRouter

from app.activities import router as activities_router
from app.ai import router as ai_router
from app.analytics import router as analytics_router
from app.api.v1.endpoints import goals, health
from app.auth import router as auth_router
from app.goals import tasks_router
from app.heatmaps import router as heatmaps_router
from app.integrations import router as integrations_router
from app.notifications import router as notifications_router
from app.tracking import router as tracking_router

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth_router.router, prefix="/auth", tags=["auth"])
api_router.include_router(activities_router.router, prefix="/activities", tags=["activities"])
api_router.include_router(tracking_router.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(heatmaps_router.router, prefix="/heatmaps", tags=["heatmaps"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(tasks_router.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(analytics_router.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai_router.router, prefix="/ai", tags=["ai"])
api_router.include_router(integrations_router.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(notifications_router.router, prefix="/notifications", tags=["notifications"])
