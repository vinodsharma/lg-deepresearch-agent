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
    # idle, planning, searching, analyzing, synthesizing
    current_step: str = "idle"  # type: ignore[misc]

    # Search queries and their status - {query, status, results_count}
    searches: list[dict[str, Any]] = []  # type: ignore[misc]

    # Sources discovered during research - {url, title, snippet}
    sources_found: list[dict[str, Any]] = []  # type: ignore[misc]

    # Log of tool calls made
    tool_calls_log: list[dict[str, Any]] = []  # type: ignore[misc]

    # Whether research is complete
    research_complete: bool = False  # type: ignore[misc]

    # Final research report
    final_report: str | None = None  # type: ignore[misc]
