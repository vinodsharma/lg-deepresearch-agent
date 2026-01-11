#!/usr/bin/env python3
"""Seed a test user for development/preview environments."""

import asyncio
import os
import sys

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prisma import Prisma


async def seed_test_user() -> None:
    """Create a test user if one doesn't exist."""
    db = Prisma()
    await db.connect()

    try:
        # Check if test user exists
        test_email = "test@example.com"
        existing = await db.user.find_unique(where={"email": test_email})

        if existing:
            print(f"Test user already exists:")
            print(f"  Email: {existing.email}")
            print(f"  API Key: {existing.apiKey}")
            return

        # Create test user
        user = await db.user.create(
            data={
                "email": test_email,
                "name": "Test User",
            }
        )

        print(f"Created test user:")
        print(f"  Email: {user.email}")
        print(f"  API Key: {user.apiKey}")
        print(f"\nUse this API key to authenticate in the UI.")

    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_test_user())
