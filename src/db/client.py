"""Prisma database client singleton."""

from prisma import Prisma

# Global Prisma client instance
prisma = Prisma()


async def connect_db() -> None:
    """Connect to database."""
    await prisma.connect()


async def disconnect_db() -> None:
    """Disconnect from database."""
    await prisma.disconnect()
