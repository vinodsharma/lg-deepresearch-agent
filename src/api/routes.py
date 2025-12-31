# src/api/routes.py
"""API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@router.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Deep Research Agent API", "version": "0.1.0"}
