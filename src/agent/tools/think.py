"""Think tool for agent strategic reflection."""

from langchain_core.tools import tool


@tool
def think_tool(thought: str) -> str:
    """Use this tool to pause and think strategically about your approach.

    Args:
        thought: Your strategic thinking about the current task.

    Returns:
        Acknowledgment of the thought.
    """
    return f"Thought noted: {thought}"
