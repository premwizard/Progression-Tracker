import time
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
