# src/agent/state.py
"""Agent state for CopilotKit integration with AG-UI protocol."""

from typing import Any

from langgraph.graph import MessagesState


class ResearchAgentState(MessagesState):
    """State for the research agent with CopilotKit support.

    Extends MessagesState to include research progress tracking
    that can be synced with the frontend via AG-UI protocol.
    """

    # Current step in the research process
    current_step: str = "idle"  # idle, planning, searching, analyzing, synthesizing

    # Search queries and their status
    searches: list[dict[str, Any]] = []  # {query, status, results_count}

    # Sources discovered during research
    sources_found: list[dict[str, Any]] = []  # {url, title, snippet}

    # Log of tool calls made
    tool_calls_log: list[dict[str, Any]] = []

    # Whether research is complete
    research_complete: bool = False

    # Final research report
    final_report: str | None = None
