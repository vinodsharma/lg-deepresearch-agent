"""Tests for authentication service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_get_current_user_with_valid_api_key():
    """Test authentication with valid API key."""
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.email = "test@example.com"

    # Mock prisma before importing the module
    with patch.dict("sys.modules", {"prisma.models": MagicMock()}):
        with patch("src.db.client.prisma") as mock_prisma:
            mock_prisma.user.find_unique = AsyncMock(return_value=mock_user)

            # Need to reload or import fresh
            from src.services.auth import get_user_by_api_key

            # Re-patch at the correct location after import
            with patch("src.services.auth.prisma", mock_prisma):
                user = await get_user_by_api_key("valid-key")

                assert user is not None
                assert user.id == "user-123"
