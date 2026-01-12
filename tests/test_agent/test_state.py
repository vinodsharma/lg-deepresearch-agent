# tests/test_agent/test_state.py
"""Tests for research agent state module."""


def test_research_agent_state_default_values():
    """Test ResearchAgentState has correct default values defined."""
    from src.agent.state import ResearchAgentState

    # TypedDict returns a dict when instantiated
    state: ResearchAgentState = {
        "messages": [],
        "current_step": "idle",
        "searches": [],
        "sources_found": [],
        "tool_calls_log": [],
        "research_complete": False,
        "final_report": None,
    }

    assert state["current_step"] == "idle"
    assert state["searches"] == []
    assert state["sources_found"] == []
    assert state["tool_calls_log"] == []
    assert state["research_complete"] is False
    assert state["final_report"] is None


def test_research_agent_state_custom_values():
    """Test ResearchAgentState accepts custom values."""
    from src.agent.state import ResearchAgentState

    searches = [{"query": "test query", "status": "completed", "results_count": 5}]
    sources = [{"url": "https://example.com", "title": "Test", "snippet": "..."}]

    state: ResearchAgentState = {
        "messages": [],
        "current_step": "searching",
        "searches": searches,
        "sources_found": sources,
        "tool_calls_log": [],
        "research_complete": True,
        "final_report": "Final report content",
    }

    assert state["current_step"] == "searching"
    assert state["searches"] == searches
    assert state["sources_found"] == sources
    assert state["research_complete"] is True
    assert state["final_report"] == "Final report content"


def test_research_agent_state_has_required_fields():
    """Test ResearchAgentState defines all required fields."""
    from src.agent.state import ResearchAgentState

    # Check that the TypedDict has all expected annotations
    annotations = ResearchAgentState.__annotations__

    expected_fields = [
        "current_step",
        "searches",
        "sources_found",
        "tool_calls_log",
        "research_complete",
        "final_report",
    ]

    for field in expected_fields:
        assert field in annotations, f"Missing field: {field}"


def test_research_agent_state_valid_steps():
    """Test that current_step can be set to valid research stages."""
    from src.agent.state import ResearchAgentState

    valid_steps = ["idle", "planning", "searching", "analyzing", "synthesizing"]

    for step in valid_steps:
        state: ResearchAgentState = {
            "messages": [],
            "current_step": step,
            "searches": [],
            "sources_found": [],
            "tool_calls_log": [],
            "research_complete": False,
            "final_report": None,
        }
        assert state["current_step"] == step
