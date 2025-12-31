"""Report repository for database operations."""

from typing import Any

from prisma.models import Report

from prisma import Prisma


class ReportRepository:
    """Repository for Report CRUD operations."""

    def __init__(self, db: Prisma) -> None:
        """Initialize with Prisma client."""
        self.db = db

    async def create(
        self,
        session_id: str,
        title: str,
        markdown: str,
        json_data: dict[str, Any],
        sources: list[dict[str, Any]],
    ) -> Report:
        """Create a new report."""
        return await self.db.report.create(
            data={
                "sessionId": session_id,
                "title": title,
                "markdown": markdown,
                "jsonData": json_data,
                "sources": sources,
            }
        )

    async def get_by_id(self, report_id: str) -> Report | None:
        """Get report by ID."""
        return await self.db.report.find_unique(where={"id": report_id})

    async def get_session_reports(self, session_id: str) -> list[Report]:
        """Get all reports for a session."""
        return await self.db.report.find_many(
            where={"sessionId": session_id}, order={"createdAt": "desc"}
        )

    async def delete(self, report_id: str) -> Report | None:
        """Delete report by ID."""
        return await self.db.report.delete(where={"id": report_id})
