# src/api/sessions.py
"""Session management API routes."""

from fastapi import APIRouter, HTTPException, status

from src.db.client import prisma
from src.db.repositories import ReportRepository, SessionRepository
from src.models.schemas import (
    ReportResponse,
    SessionCreate,
    SessionListResponse,
    SessionResponse,
)
from src.services import CurrentUser, RateLimitedUser, log_usage

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=SessionResponse)
async def create_session(
    data: SessionCreate,
    user: RateLimitedUser,
) -> SessionResponse:
    """Create a new research session."""
    repo = SessionRepository(prisma)
    session = await repo.create(user_id=user.id, title=data.title)

    await log_usage(user.id, "create_session")

    return SessionResponse(
        id=session.id,
        title=session.title,
        status=session.status,
        created_at=session.createdAt,
        updated_at=session.updatedAt,
    )


@router.get("/", response_model=SessionListResponse)
async def list_sessions(
    user: CurrentUser,
) -> SessionListResponse:
    """List all sessions for the current user."""
    repo = SessionRepository(prisma)
    sessions = await repo.get_user_sessions(user.id)

    return SessionListResponse(
        sessions=[
            SessionResponse(
                id=s.id,
                title=s.title,
                status=s.status,
                created_at=s.createdAt,
                updated_at=s.updatedAt,
            )
            for s in sessions
        ],
        total=len(sessions),
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user: CurrentUser,
) -> SessionResponse:
    """Get a specific session."""
    repo = SessionRepository(prisma)
    session = await repo.get_by_id(session_id)

    if not session or session.userId != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return SessionResponse(
        id=session.id,
        title=session.title,
        status=session.status,
        created_at=session.createdAt,
        updated_at=session.updatedAt,
    )


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user: CurrentUser,
) -> dict[str, str]:
    """Delete a session."""
    repo = SessionRepository(prisma)
    session = await repo.get_by_id(session_id)

    if not session or session.userId != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    await repo.delete(session_id)

    return {"status": "deleted"}


@router.get("/{session_id}/reports", response_model=list[ReportResponse])
async def get_session_reports(
    session_id: str,
    user: CurrentUser,
) -> list[ReportResponse]:
    """Get all reports for a session."""
    session_repo = SessionRepository(prisma)
    session = await session_repo.get_by_id(session_id)

    if not session or session.userId != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    report_repo = ReportRepository(prisma)
    reports = await report_repo.get_session_reports(session_id)

    return [
        ReportResponse(
            id=r.id,
            title=r.title,
            markdown=r.markdown,
            json_data=r.jsonData,
            sources=r.sources,
            created_at=r.createdAt,
        )
        for r in reports
    ]
