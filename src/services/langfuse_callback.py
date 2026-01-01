"""LangFuse observability integration."""

import os
import uuid
from typing import Any

from langfuse import Langfuse
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler

# Global Langfuse client instance
_langfuse_client: Langfuse | None = None


def get_langfuse_client() -> Langfuse | None:
    """Get or create the global Langfuse client.

    Returns:
        Langfuse client or None if not configured.
    """
    global _langfuse_client

    if _langfuse_client is not None:
        return _langfuse_client

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

    if not public_key or not secret_key:
        return None

    _langfuse_client = Langfuse(
        public_key=public_key,
        secret_key=secret_key,
        host=host,
    )
    return _langfuse_client


def create_langfuse_callback() -> LangfuseCallbackHandler | None:
    """Create LangFuse callback handler if configured.

    The handler requires a Langfuse client to be initialized first.
    Credentials are read from environment variables:
    - LANGFUSE_PUBLIC_KEY
    - LANGFUSE_SECRET_KEY
    - LANGFUSE_HOST

    Returns:
        LangFuse callback handler or None if not configured.
    """
    # Initialize the global client first
    client = get_langfuse_client()
    if client is None:
        return None

    # Create callback handler - it uses the global client
    return LangfuseCallbackHandler()


def build_langfuse_config(
    user_id: str,
    session_id: str,
    request_id: str | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """Build LangGraph config with LangFuse tracing metadata.

    This creates a config dict that can be passed to agent.ainvoke()
    to enable proper grouping in LangFuse by user, session, and request.

    Args:
        user_id: User identifier for grouping traces by user.
        session_id: Session identifier for grouping traces by conversation.
        request_id: Optional unique request ID (auto-generated if not provided).
        tags: Optional list of tags for filtering traces.

    Returns:
        Config dict with callbacks and metadata for LangFuse grouping.

    Example:
        ```python
        config = build_langfuse_config(
            user_id="user_123",
            session_id="session_456",
            tags=["research", "web-search"],
        )
        result = await agent.ainvoke({"messages": [...]}, config=config)
        ```
    """
    # Create callback handler
    callback = create_langfuse_callback()
    callbacks = [callback] if callback else []

    # Generate request ID if not provided
    if request_id is None:
        request_id = str(uuid.uuid4())

    # Build metadata for LangFuse
    # Note: We don't set run_name here as it propagates to all nested calls
    # causing confusing duplicate names. LangFuse will auto-name traces.
    metadata: dict[str, Any] = {
        "langfuse_user_id": user_id,
        "langfuse_session_id": session_id,
        "request_id": request_id,  # Store for reference, not used by LangFuse
    }

    if tags:
        metadata["langfuse_tags"] = tags

    return {
        "callbacks": callbacks,
        "metadata": metadata,
        "recursion_limit": 30,
    }
