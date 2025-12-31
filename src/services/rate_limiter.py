"""Rate limiting service using database tracking."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from prisma.models import User
from prisma.enums import RateLimitTier

from src.config import get_settings
from src.db.client import prisma
from src.services.auth import get_current_user


async def check_rate_limit(user: User) -> bool:
    """Check if user is within rate limits.

    Args:
        user: The user to check.

    Returns:
        True if within limits.

    Raises:
        HTTPException: If rate limit exceeded.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)

    # Get limits based on tier
    if user.rateLimitTier == RateLimitTier.UNLIMITED:
        return True
    elif user.rateLimitTier == RateLimitTier.PRO:
        rpm_limit = settings.pro_tier_rpm
        rpd_limit = settings.pro_tier_rpd
    else:  # FREE
        rpm_limit = settings.free_tier_rpm
        rpd_limit = settings.free_tier_rpd

    # Check requests per minute
    minute_ago = now - timedelta(minutes=1)
    rpm_count = await prisma.usagelog.count(
        where={
            "userId": user.id,
            "createdAt": {"gte": minute_ago},
        }
    )

    if rpm_count >= rpm_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {rpm_limit} requests per minute",
        )

    # Check requests per day
    day_ago = now - timedelta(days=1)
    rpd_count = await prisma.usagelog.count(
        where={
            "userId": user.id,
            "createdAt": {"gte": day_ago},
        }
    )

    if rpd_count >= rpd_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {rpd_limit} requests per day",
        )

    return True


async def log_usage(
    user_id: str,
    action: str,
    tokens: int | None = None,
    cost: float | None = None,
) -> None:
    """Log API usage for rate limiting and billing.

    Args:
        user_id: The user ID.
        action: The action performed.
        tokens: Optional token count.
        cost: Optional estimated cost.
    """
    await prisma.usagelog.create(
        data={
            "userId": user_id,
            "action": action,
            "tokens": tokens,
            "cost": cost,
        }
    )


async def rate_limit_dependency(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """FastAPI dependency that checks rate limits.

    Args:
        user: The authenticated user.

    Returns:
        The user if within limits.
    """
    await check_rate_limit(user)
    return user


RateLimitedUser = Annotated[User, Depends(rate_limit_dependency)]
