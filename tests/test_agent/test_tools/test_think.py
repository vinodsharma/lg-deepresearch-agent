"""Tests for think tool."""

import pytest
from src.agent.tools.think import think_tool


def test_think_tool_returns_input():
    """Think tool should return acknowledgment."""
    result = think_tool.invoke({"thought": "I should search for more sources"})

    assert "thought" in result.lower() or "noted" in result.lower()
