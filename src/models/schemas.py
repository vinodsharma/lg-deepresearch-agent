# src/models/schemas.py
"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SessionCreate(BaseModel):
    """Request to create a session."""

    title: str | None = None


class SessionResponse(BaseModel):
    """Session response."""

    id: str
    title: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """List of sessions response."""

    sessions: list[SessionResponse]
    total: int


class ReportResponse(BaseModel):
    """Report response."""

    id: str
    title: str
    markdown: str
    json_data: dict[str, Any]
    sources: list[dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
