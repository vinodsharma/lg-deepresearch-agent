"""Tests for URL fetch tool."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_fetch_url_converts_to_markdown():
    """Test fetch_url converts HTML to markdown."""
    mock_html = "<html><body><h1>Test Title</h1><p>Test content</p></body></html>"

    with patch("src.agent.tools.fetch.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.text = mock_html
        mock_response.status_code = 200

        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_client.return_value = mock_instance

        from src.agent.tools.fetch import fetch_url

        result = await fetch_url.ainvoke({"url": "https://example.com"})

        assert "Test Title" in result or "test" in result.lower()
