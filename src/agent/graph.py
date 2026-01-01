# src/agent/graph.py
"""Main research agent graph using deepagents."""

import os
from enum import Enum
from typing import Any
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import BaseCallbackHandler
from deepagents import create_deep_agent

from .prompts import ORCHESTRATOR_PROMPT
from .tools import (
    tavily_search,
    fetch_url,
    analyze_pdf,
    analyze_document,
    e2b_execute,
    think_tool,
)
from .subagents import get_researcher_config


class HITLMode(str, Enum):
    """Human-in-the-loop modes."""

    NONE = "none"
    SENSITIVE = "sensitive"
    CHECKPOINTS = "checkpoints"
    FULL = "full"


def get_model(
    callbacks: list[BaseCallbackHandler] | None = None,
    reasoning: bool = True,
) -> ChatOpenAI:
    """Initialize MiMo V2 Flash via OpenRouter.

    Args:
        callbacks: Optional list of callback handlers (e.g., LangFuse).
        reasoning: Enable extended reasoning/thinking mode (default: True).
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")

    # Build extra body parameters for OpenRouter
    extra_body = {}
    if reasoning:
        extra_body["reasoning"] = {"enabled": True}

    return ChatOpenAI(
        model="xiaomi/mimo-v2-flash:free",
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        temperature=0.0,
        max_tokens=65536,
        callbacks=callbacks or [],
        extra_body=extra_body if extra_body else None,
    )


def create_research_agent(
    hitl_mode: HITLMode = HITLMode.SENSITIVE,
    callbacks: list[BaseCallbackHandler] | None = None,
) -> Any:
    """Create the deep research agent.

    Args:
        hitl_mode: Human-in-the-loop configuration.
        callbacks: Optional list of callback handlers (e.g., LangFuse).

    Returns:
        Compiled LangGraph agent.
    """
    model = get_model(callbacks=callbacks)

    # All tools available to orchestrator
    all_tools = [
        tavily_search,
        fetch_url,
        analyze_pdf,
        analyze_document,
        e2b_execute,
        think_tool,
    ]

    # Sensitive tools that may require approval
    sensitive_tools = [e2b_execute]

    # Configure interrupt points
    interrupt_config = _build_interrupt_config(hitl_mode, sensitive_tools)

    # Get researcher sub-agent config
    researcher = get_researcher_config(model)

    # Create the agent
    graph = create_deep_agent(
        model=model,
        system_prompt=ORCHESTRATOR_PROMPT,
        tools=all_tools,
        subagents=[researcher],
        interrupt_on=interrupt_config,
    )

    return graph


def _build_interrupt_config(
    mode: HITLMode,
    sensitive_tools: list[Any],
) -> dict[str, Any]:
    """Build interrupt configuration based on HITL mode."""
    if mode == HITLMode.NONE:
        return {}

    if mode == HITLMode.FULL:
        return {"*": {"allowed_decisions": ["approve", "reject", "modify"]}}

    if mode == HITLMode.SENSITIVE:
        return {
            tool.name: {"allowed_decisions": ["approve", "reject"]}
            for tool in sensitive_tools
        }

    if mode == HITLMode.CHECKPOINTS:
        return {
            "synthesis_checkpoint": {
                "allowed_decisions": ["approve", "reject", "continue_research"]
            }
        }

    return {}
