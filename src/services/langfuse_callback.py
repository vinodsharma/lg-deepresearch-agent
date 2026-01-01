"""LangFuse observability integration."""

import os
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
