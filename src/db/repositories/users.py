"""User repository for database operations."""

from prisma.models import User

from prisma import Prisma


class UserRepository:
    """Repository for User CRUD operations."""

    def __init__(self, db: Prisma) -> None:
        """Initialize with Prisma client."""
        self.db = db

    async def create(self, email: str, name: str | None = None) -> User:
        """Create a new user."""
        return await self.db.user.create(data={"email": email, "name": name})

    async def get_by_id(self, user_id: str) -> User | None:
        """Get user by ID."""
        return await self.db.user.find_unique(where={"id": user_id})

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return await self.db.user.find_unique(where={"email": email})

    async def get_by_api_key(self, api_key: str) -> User | None:
        """Get user by API key."""
        return await self.db.user.find_unique(where={"apiKey": api_key})

    async def delete(self, user_id: str) -> User | None:
        """Delete user by ID."""
        return await self.db.user.delete(where={"id": user_id})
