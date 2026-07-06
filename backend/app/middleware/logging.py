import uuid
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = str(uuid.uuid4())
        
        # Sanitize query parameters if they contain sensitive tokens/passwords
        query_params = dict(request.query_params)
        for key in ["password", "token", "access_token", "secret"]:
            if key in query_params:
                query_params[key] = "******"
                
        # Structured request start log
        logger.info(
            f"Request {request_id} - Method: {request.method} - "
            f"Path: {request.url.path} - QueryParams: {query_params}"
        )
        
        try:
            response = await call_next(request)
            logger.info(f"Request {request_id} - Status Code: {response.status_code}")
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            logger.error(f"Request {request_id} - Exception failed: {str(e)}")
            raise
