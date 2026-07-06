from typing import Generator

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.database.session import get_db
# Models and schemas will be imported here when needed

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if token_data is None:
            raise UnauthorizedException(detail="Could not validate credentials")
    except (JWTError, ValidationError):
        raise UnauthorizedException(detail="Could not validate credentials")
    
    # Placeholder: fetch user from db
    # user = await crud.user.get(db, id=token_data)
    # if not user:
    #     raise NotFoundException(detail="User not found")
    # return user
    return {"id": token_data, "is_active": True}
