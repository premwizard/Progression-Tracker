import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.core.security import get_password_hash
from app.database.session import get_db
from app.models.user import User

DEFAULT_OWNER_ID = uuid.UUID("ee8d8906-8a8f-45b9-be84-d9fc46000ea1")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


async def get_or_create_owner_user(db: AsyncSession) -> User:
    """Retrieve existing owner user or create initial default personal owner."""
    result = await db.execute(select(User).filter(User.id == DEFAULT_OWNER_ID))
    user = result.scalars().first()
    if not user:
        # Fall back to any first user in database
        any_user = (await db.execute(select(User).order_by(User.created_at.asc()).limit(1))).scalars().first()
        if any_user:
            return any_user
        
        # Seed default personal owner if table is completely empty
        user = User(
            id=DEFAULT_OWNER_ID,
            email="owner@progressiontracker.local",
            hashed_password=get_password_hash("owner12345"),
            full_name="Personal Owner",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
) -> User:
    if token:
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_data = payload.get("sub")
            if token_data is not None:
                user_uuid = uuid.UUID(token_data)
                result = await db.execute(select(User).filter(User.id == user_uuid))
                user = result.scalars().first()
                if user:
                    return user
        except (JWTError, ValidationError, ValueError):
            # If invalid token was explicitly sent in non-development mode, raise Unauthorized
            if settings.ENVIRONMENT == "production":
                raise UnauthorizedException(detail="Could not validate credentials")
            # In development/personal mode, fall back to owner user
    
    # Seamless personal owner identity for zero-barrier single-user usage
    return await get_or_create_owner_user(db)


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedException(detail="Inactive user")
    return current_user
