from typing import Any

import redis
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.session import get_db

router = APIRouter()

@router.get("")
async def health_check(
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    db_healthy = True
    redis_healthy = True
    
    # 1. Verify Database connectivity
    try:
        await db.execute(select(1))
    except Exception:
        db_healthy = False

    # 2. Verify Redis connectivity
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
    except Exception:
        if settings.ENVIRONMENT == "production":
            redis_healthy = False

    # 3. Determine overall health status
    if not db_healthy or not redis_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "reachable" if db_healthy else "unreachable",
            "redis": "reachable" if redis_healthy else "unreachable"
        }

    return {
        "status": "healthy",
        "database": "reachable",
        "redis": "reachable",
        "message": "All backing services online"
    }
