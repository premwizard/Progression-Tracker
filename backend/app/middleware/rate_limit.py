import logging
import time

import redis
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("RateLimiter")

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        redis_url: str,
        requests_limit: int = 150,
        window_seconds: int = 60
    ):
        super().__init__(app)
        self.limit = requests_limit
        self.window = window_seconds
        self.memory_store: dict[str, list[float]] = {}
        self.redis_client: redis.Redis | None = None
        
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            self.use_redis = True
            logger.info("Redis rate limiting middleware connected successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis for rate limiting, falling back to in-memory: {e}")
            self.redis_client = None
            self.use_redis = False

    async def dispatch(self, request: Request, call_next):
        # Skip rate limit verification for health probes and websockets
        if request.url.path.endswith("/health") or "ws" in request.scope.get("type", ""):
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown"
        now = int(time.time())
        
        if self.use_redis:
            try:
                key = f"ratelimit:{client_ip}"
                pipe = self.redis_client.pipeline()
                pipe.zremrangebyscore(key, 0, now - self.window)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, self.window)
                results = pipe.execute()
                request_count = results[2]
                
                if request_count > self.limit:
                    return Response(
                        content="Too Many Requests - Rate limit exceeded. Please try again later.",
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )
            except Exception as e:
                logger.error(f"Redis rate limiting error, executing in-memory fallback: {e}")
                if self._check_memory_limit(client_ip, now):
                    return Response(
                        content="Too Many Requests - Rate limit exceeded. Please try again later.",
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )
        else:
            if self._check_memory_limit(client_ip, now):
                return Response(
                    content="Too Many Requests - Rate limit exceeded. Please try again later.",
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS
                )
                
        return await call_next(request)

    def _check_memory_limit(self, client_ip: str, now: int) -> bool:
        if client_ip not in self.memory_store:
            self.memory_store[client_ip] = []
            
        self.memory_store[client_ip] = [
            t for t in self.memory_store[client_ip] if t > now - self.window
        ]
        
        if len(self.memory_store[client_ip]) >= self.limit:
            return True
            
        self.memory_store[client_ip].append(now)
        return False
