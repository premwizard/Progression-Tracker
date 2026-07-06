import uuid
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = str(uuid.uuid4())
        logger.info(f"Request {request_id} started: {request.method} {request.url}")
        
        try:
            response = await call_next(request)
            logger.info(f"Request {request_id} completed: {response.status_code}")
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            logger.error(f"Request {request_id} failed: {str(e)}")
            raise
