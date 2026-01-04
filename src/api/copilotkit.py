# src/api/copilotkit.py
"""CopilotKit endpoint for AG-UI protocol integration."""

from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from copilotkit import LangGraphAGUIAgent
from fastapi import FastAPI

from src.agent.graph import HITLMode, create_research_agent


def setup_copilotkit_endpoint(app: FastAPI) -> None:
    """Set up CopilotKit AG-UI endpoint on the FastAPI app.

    Args:
        app: The FastAPI application instance.
    """
    # Create the research agent graph
    graph = create_research_agent(hitl_mode=HITLMode.NONE)

    # Wrap with CopilotKit's LangGraph AG-UI agent
    agent = LangGraphAGUIAgent(
        name="research_agent",
        description=(
            "Deep research agent that searches the web, analyzes documents, "
            "and synthesizes comprehensive research reports on any topic."
        ),
        graph=graph,
    )

    # Add the AG-UI endpoint
    add_langgraph_fastapi_endpoint(
        app=app,
        agent=agent,
        path="/copilotkit",
    )
