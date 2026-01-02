# src/api/research.py
"""Research API routes."""

import uuid

from fastapi import APIRouter, HTTPException, status
from prisma.enums import SessionStatus

from src.agent.graph import HITLMode, create_research_agent
from src.db.client import prisma
from src.db.repositories import SessionRepository
from src.models.schemas import ResearchRequest, ResearchResponse
from src.services import RateLimitedUser, build_langfuse_config, log_usage

router = APIRouter(prefix="/research", tags=["research"])


@router.post("/{session_id}", response_model=ResearchResponse)
async def run_research(
    session_id: str,
    data: ResearchRequest,
    user: RateLimitedUser,
) -> ResearchResponse:
    """Run a research query within a session.

    Each session represents a conversation/chat. All queries within the same
    session are grouped together in LangFuse for easy tracking.

    A new session should be created for each new chat/conversation.
    """
    # Verify session belongs to user
    repo = SessionRepository(prisma)
    session = await repo.get_by_id(session_id)

    if not session or session.userId != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Generate unique request ID for this invocation
    request_id = str(uuid.uuid4())

    # Build LangFuse config with grouping metadata
    # - user_id: Groups all traces by user
    # - session_id: Groups traces within a conversation/chat
    # - request_id: Unique identifier for this specific request
    config = build_langfuse_config(
        user_id=user.id,
        session_id=session_id,
        request_id=request_id,
        tags=data.tags or ["research"],
    )

    # Create agent (callbacks are passed via config, not agent creation)
    agent = create_research_agent(hitl_mode=HITLMode.NONE)

    # Run the research query
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": data.query}]},
        config=config,
    )

    # Extract final response
    response_text = ""
    tool_calls_list = []

    for msg in result.get("messages", []):
        msg_type = type(msg).__name__
        if msg_type == "AIMessage":
            if msg.content:
                response_text = msg.content
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                tool_calls_list.extend(
                    {"name": tc.get("name"), "args": tc.get("args")} for tc in msg.tool_calls
                )

    # Log usage
    await log_usage(user.id, "research_query")

    # Update session to mark it as active
    await repo.update_status(session_id, SessionStatus.active)

    return ResearchResponse(
        request_id=request_id,
        session_id=session_id,
        query=data.query,
        response=response_text,
        tool_calls=tool_calls_list,
    )
