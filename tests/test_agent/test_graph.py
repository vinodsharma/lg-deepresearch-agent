# tests/test_agent/test_graph.py
"""Tests for research agent graph."""

from unittest.mock import MagicMock, patch


def test_create_research_agent_returns_graph():
    """Test agent creation returns a compiled graph."""
    with (
        patch("src.agent.graph.get_model") as mock_get_model,
        patch("src.agent.graph.create_deep_agent") as mock_create,
    ):
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_graph = MagicMock()
        mock_create.return_value = mock_graph

        from src.agent.graph import HITLMode, create_research_agent

        graph = create_research_agent(hitl_mode=HITLMode.NONE)

        assert graph is not None
        mock_create.assert_called_once()


def test_hitl_mode_sensitive_interrupts_code_exec():
    """Test sensitive mode configures interrupt on code execution."""
    with (
        patch("src.agent.graph.get_model") as mock_get_model,
        patch("src.agent.graph.create_deep_agent") as mock_create,
    ):
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_graph = MagicMock()
        mock_create.return_value = mock_graph

        from src.agent.graph import HITLMode, create_research_agent

        create_research_agent(hitl_mode=HITLMode.SENSITIVE)

        call_kwargs = mock_create.call_args.kwargs
        assert "interrupt_on" in call_kwargs
        assert "e2b_execute" in call_kwargs["interrupt_on"]
