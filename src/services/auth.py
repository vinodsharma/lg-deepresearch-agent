"""Authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from prisma.models import User
from pydantic import BaseModel

from src.config import get_settings
from src.db.client import prisma


class TokenData(BaseModel):
    """JWT token payload."""

    user_id: str
    exp: datetime


async def get_user_by_api_key(api_key: str) -> User | None:
    """Get user by API key.

    Args:
        api_key: The API key to look up.

    Returns:
        User if found, None otherwise.
    """
    return await prisma.user.find_unique(where={"apiKey": api_key})


def create_access_token(user_id: str) -> str:
    """Create JWT access token.

    Args:
        user_id: The user ID to encode.

    Returns:
        Encoded JWT token.
    """
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)

    payload = {"user_id": user_id, "exp": expire}

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenData | None:
    """Decode JWT access token.

    Args:
        token: The JWT token to decode.

    Returns:
        TokenData if valid, None otherwise.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenData(user_id=payload["user_id"], exp=payload["exp"])
    except JWTError:
        return None


async def get_current_user(
    x_api_key: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Get current authenticated user.

    Supports both API key and JWT authentication.

    Args:
        x_api_key: Optional API key header.
        authorization: Optional Bearer token header.

    Returns:
        Authenticated user.

    Raises:
        HTTPException: If authentication fails.
    """
    # Try API key first
    if x_api_key:
        user = await get_user_by_api_key(x_api_key)
        if user:
            return user

    # Try JWT token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        token_data = decode_access_token(token)

        if token_data:
            user = await prisma.user.find_unique(where={"id": token_data.user_id})
            if user:
                return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


# FastAPI dependency
CurrentUser = Annotated[User, Depends(get_current_user)]
