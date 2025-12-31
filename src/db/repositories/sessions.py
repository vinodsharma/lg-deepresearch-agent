"""Session repository for database operations."""

from typing import Any

from prisma.enums import SessionStatus
from prisma.models import Session

from prisma import Prisma


class SessionRepository:
    """Repository for Session CRUD operations."""

    def __init__(self, db: Prisma) -> None:
        """Initialize with Prisma client."""
        self.db = db

    async def create(self, user_id: str, title: str | None = None) -> Session:
        """Create a new session."""
        return await self.db.session.create(data={"userId": user_id, "title": title})

    async def get_by_id(self, session_id: str) -> Session | None:
        """Get session by ID with relations."""
        return await self.db.session.find_unique(
            where={"id": session_id}, include={"reports": True, "artifacts": True}
        )

    async def get_user_sessions(
        self, user_id: str, status: SessionStatus | None = None
    ) -> list[Session]:
        """Get all sessions for a user."""
        where: dict[str, Any] = {"userId": user_id}
        if status:
            where["status"] = status
        return await self.db.session.find_many(where=where, order={"createdAt": "desc"})

    async def update_state(
        self, session_id: str, state: dict[str, Any], messages: list[dict[str, Any]]
    ) -> Session:
        """Update session state and messages."""
        return await self.db.session.update(
            where={"id": session_id}, data={"state": state, "messages": messages}
        )

    async def update_status(self, session_id: str, status: SessionStatus) -> Session:
        """Update session status."""
        return await self.db.session.update(where={"id": session_id}, data={"status": status})

    async def delete(self, session_id: str) -> Session | None:
        """Delete session by ID."""
        return await self.db.session.delete(where={"id": session_id})
