# src/agent/subagents/researcher.py
"""Research sub-agent configuration."""

from typing import Any

from langchain_core.language_models import BaseChatModel

from ..prompts import RESEARCHER_PROMPT
from ..tools import analyze_document, analyze_pdf, fetch_url, tavily_search, think_tool


def get_researcher_config(model: BaseChatModel) -> dict[str, Any]:
    """Get researcher sub-agent configuration.

    Args:
        model: The LLM to use for the researcher.

    Returns:
        Sub-agent configuration dictionary for deepagents.
    """
    return {
        "name": "researcher",
        "description": (
            "Conducts focused research on a single topic. "
            "Give this agent one specific research question at a time."
        ),
        "system_prompt": RESEARCHER_PROMPT,
        "tools": [
            tavily_search,
            fetch_url,
            analyze_pdf,
            analyze_document,
            think_tool,
        ],
        "model": model,
    }
