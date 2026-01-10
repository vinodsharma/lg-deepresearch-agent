# src/api/copilotkit.py
"""CopilotKit endpoint for AG-UI protocol integration."""

from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from fastapi import FastAPI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import CONF

from src.agent.graph import HITLMode, create_research_agent
from src.api.agui_agent import FixedLangGraphAGUIAgent
from src.services import create_langfuse_callback

# Agent configuration
AGENT_NAME = "research_agent"
AGENT_DESCRIPTION = (
    "Deep research agent that searches the web, analyzes documents, "
    "and synthesizes comprehensive research reports on any topic."
)


def setup_copilotkit_endpoint(app: FastAPI) -> None:
    """Set up CopilotKit AG-UI endpoint on the FastAPI app.

    Args:
        app: The FastAPI application instance.
    """
    # Create the research agent graph with checkpointer for AG-UI state management
    # Use actual MemorySaver instance for LangGraph 1.0 compatibility
    checkpointer = MemorySaver()
    graph = create_research_agent(hitl_mode=HITLMode.NONE, checkpointer=checkpointer)

    # Create Langfuse callback for observability
    langfuse_callback = create_langfuse_callback()
    callbacks = [langfuse_callback] if langfuse_callback else []

    # Wrap with our fixed LangGraph AG-UI agent
    # Provides config with checkpoint_ns for LangGraph 1.0 compatibility
    # and fixes tool_call_name being None in OnToolEnd events
    agent = FixedLangGraphAGUIAgent(
        name=AGENT_NAME,
        description=AGENT_DESCRIPTION,
        graph=graph,
        config={
            CONF: {"checkpoint_ns": ""},
            "callbacks": callbacks,
            "recursion_limit": 50,  # Increase from default 25
        },
    )

    # Add the AG-UI endpoint
    add_langgraph_fastapi_endpoint(
        app=app,
        agent=agent,
        path="/copilotkit",
    )

    # Add /info endpoint for CopilotKit React client compatibility
    @app.post("/copilotkit/info")
    @app.get("/copilotkit/info")
    async def copilotkit_info():
        """Return agent information for CopilotKit frontend."""
        return {
            "agents": [
                {
                    "name": AGENT_NAME,
                    "description": AGENT_DESCRIPTION,
                }
            ],
            "actions": [],
        }
