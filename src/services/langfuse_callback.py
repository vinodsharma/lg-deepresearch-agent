"""LangFuse observability integration."""

import os
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler


def create_langfuse_callback() -> LangfuseCallbackHandler | None:
    """Create LangFuse callback handler if configured.

    The handler reads credentials from environment variables:
    - LANGFUSE_PUBLIC_KEY
    - LANGFUSE_SECRET_KEY
    - LANGFUSE_HOST

    Returns:
        LangFuse callback handler or None if not configured.
    """
    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")

    if not public_key or not secret_key:
        return None

    # New langfuse API reads secret_key and host from env vars automatically
    return LangfuseCallbackHandler(public_key=public_key)
