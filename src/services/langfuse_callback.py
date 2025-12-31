"""LangFuse observability integration."""

import os
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler


def create_langfuse_callback() -> LangfuseCallbackHandler | None:
    """Create LangFuse callback handler if configured.

    Returns:
        LangFuse callback handler or None if not configured.
    """
    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

    if not public_key or not secret_key:
        return None

    return LangfuseCallbackHandler(
        public_key=public_key,
        secret_key=secret_key,
        host=host,
    )
