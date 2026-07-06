import logging

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.api import api_router
from app.core.config import settings
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.timing import TimingMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0",
)

# 1. CORS Configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 2. Add Gzip & Custom Performance Middlewares
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TimingMiddleware)
app.add_middleware(LoggingMiddleware)

# 3. Add Rate Limiting Middleware
app.add_middleware(
    RateLimitMiddleware,
    redis_url=settings.REDIS_URL,
    requests_limit=150,
    window_seconds=60
)

# 4. Secure Response Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# 5. Centralized Error Handlers
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logging.error(f"Database error encountered: {str(exc)}", exc_info=True)
    return Response(
        content="Internal Database error occurred.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled server error: {str(exc)}", exc_info=True)
    detail_msg = str(exc) if settings.ENVIRONMENT == "development" else "Internal server error."
    return Response(
        content=detail_msg,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# 6. Routers setup
app.include_router(api_router, prefix=settings.API_V1_STR)
