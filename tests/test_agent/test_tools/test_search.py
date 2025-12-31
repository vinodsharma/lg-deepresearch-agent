"""Tests for search tools."""

import pytest
from unittest.mock import patch, MagicMock
import os


def test_tavily_search_returns_results():
    """Test tavily search returns formatted results."""
    mock_results = {
        "results": [
            {"title": "Test Result", "url": "https://example.com", "content": "Test content"}
        ]
    }

    with patch.dict(os.environ, {"TAVILY_API_KEY": "test-api-key"}):
        with patch("src.agent.tools.search.TavilyClient") as mock_client:
            mock_instance = MagicMock()
            mock_instance.search.return_value = mock_results
            mock_client.return_value = mock_instance

            from src.agent.tools.search import tavily_search

            result = tavily_search.invoke({"query": "test query", "max_results": 5})

            assert "Test Result" in result
            assert "https://example.com" in result
