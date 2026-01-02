# src/main.py
"""Deep Research Agent - FastAPI Application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.research import router as research_router
from src.api.routes import router
from src.api.sessions import router as sessions_router
from src.config import get_settings
from src.db.client import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    await connect_db()
    yield
    # Shutdown
    await disconnect_db()


def create_app() -> FastAPI:
    """Create FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Deep Research Agent",
        description="Deep research agent using LangGraph deepagents framework",
        version="0.1.1-preview",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(router)
    app.include_router(sessions_router)
    app.include_router(research_router)

    return app


app = create_app()


def main() -> None:
    """Run application with uvicorn."""
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
