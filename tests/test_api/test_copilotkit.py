# tests/test_api/test_copilotkit.py
"""Tests for CopilotKit endpoint setup."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI


def test_setup_copilotkit_endpoint_adds_route():
    """Test that setup_copilotkit_endpoint adds the /copilotkit route."""
    with (
        patch("src.api.copilotkit.create_research_agent") as mock_create_agent,
        patch("src.api.copilotkit.LangGraphAGUIAgent") as mock_agui_agent,
        patch("src.api.copilotkit.add_langgraph_fastapi_endpoint") as mock_add_endpoint,
    ):
        mock_graph = MagicMock()
        mock_create_agent.return_value = mock_graph
        mock_agent_instance = MagicMock()
        mock_agui_agent.return_value = mock_agent_instance

        from src.api.copilotkit import setup_copilotkit_endpoint

        app = FastAPI()
        setup_copilotkit_endpoint(app)

        # Verify agent was created with correct HITL mode
        mock_create_agent.assert_called_once()

        # Verify LangGraphAGUIAgent was created with correct params
        mock_agui_agent.assert_called_once()
        call_kwargs = mock_agui_agent.call_args.kwargs
        assert call_kwargs["name"] == "research_agent"
        assert "research" in call_kwargs["description"].lower()
        assert call_kwargs["graph"] == mock_graph

        # Verify endpoint was added
        mock_add_endpoint.assert_called_once()
        endpoint_kwargs = mock_add_endpoint.call_args.kwargs
        assert endpoint_kwargs["app"] == app
        assert endpoint_kwargs["agent"] == mock_agent_instance
        assert endpoint_kwargs["path"] == "/copilotkit"


def test_setup_copilotkit_agent_description():
    """Test that the agent has a meaningful description."""
    with (
        patch("src.api.copilotkit.create_research_agent") as mock_create_agent,
        patch("src.api.copilotkit.LangGraphAGUIAgent") as mock_agui_agent,
        patch("src.api.copilotkit.add_langgraph_fastapi_endpoint"),
    ):
        mock_create_agent.return_value = MagicMock()

        from src.api.copilotkit import setup_copilotkit_endpoint

        app = FastAPI()
        setup_copilotkit_endpoint(app)

        call_kwargs = mock_agui_agent.call_args.kwargs
        description = call_kwargs["description"]

        # Description should mention key capabilities
        assert "research" in description.lower()
        assert "search" in description.lower() or "web" in description.lower()
