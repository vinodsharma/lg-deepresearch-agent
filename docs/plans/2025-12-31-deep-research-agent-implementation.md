# Deep Research Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a general-purpose deep research agent with web search, document analysis, code execution, and CopilotKit UI integration.

**Architecture:** FastAPI backend with deepagents/LangGraph orchestrating research sub-agents. PostgreSQL (Prisma) for persistence, E2B for sandboxed code execution, AG-UI protocol for CopilotKit frontend communication.

**Tech Stack:** Python 3.11+, uv, FastAPI, deepagents, LangGraph, Prisma, PostgreSQL, Docker, E2B, Tavily, LangFuse, CopilotKit/AG-UI

---

## Phase 1: Project Foundation

### Task 1.1: Initialize GitHub Repository

**GitHub Issue:** `feat: initialize project repository`

**Steps:**

**Step 1: Create GitHub repository**
```bash
gh repo create lg-deepresearch-agent --public --description "Deep research agent using LangGraph deepagents framework" --source . --remote origin --push
```

**Step 2: Rename branch to main**
```bash
git branch -m master main
git push -u origin main
```

**Step 3: Verify**
```bash
gh repo view --web
```

---

### Task 1.2: Setup uv and Project Structure

**GitHub Issue:** `feat: setup uv package management and project structure`

**Files:**
- Create: `pyproject.toml`
- Create: `.python-version`
- Create: `src/__init__.py`
- Create: `src/main.py` (placeholder)
- Create: `tests/__init__.py`
- Create: `.gitignore`

**Step 1: Create .python-version**
```
3.11
```

**Step 2: Create pyproject.toml**
```toml
[project]
name = "lg-deepresearch-agent"
version = "0.1.0"
description = "Deep research agent using LangGraph deepagents framework"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    # Agent framework
    "deepagents>=0.2.6",
    "langgraph>=0.2.0",

    # LLM
    "langchain-openai>=1.0.2",

    # API
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",

    # Database
    "prisma>=0.13.0",

    # Tools
    "tavily-python>=0.5.0",
    "e2b-code-interpreter>=1.0.0",
    "httpx>=0.28.0",
    "markdownify>=1.2.0",
    "pymupdf>=1.24.0",
    "python-docx>=1.1.0",
    "openpyxl>=3.1.0",

    # Observability
    "langfuse>=2.0.0",

    # Auth
    "python-jose[cryptography]>=3.3.0",

    # Utils
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=4.0.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "W"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.mypy]
python_version = "3.11"
strict = true
```

**Step 3: Create .gitignore**
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
.venv/
ENV/

# uv
.uv/

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.mypy_cache/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Prisma
prisma/*.db

# Docker
.docker/

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.egg-info/
```

**Step 4: Create directory structure**
```bash
mkdir -p src/agent/tools src/agent/subagents src/api src/db/repositories src/services src/models tests/test_agent tests/test_api
touch src/__init__.py src/agent/__init__.py src/agent/tools/__init__.py src/agent/subagents/__init__.py src/api/__init__.py src/db/__init__.py src/db/repositories/__init__.py src/services/__init__.py src/models/__init__.py tests/__init__.py tests/test_agent/__init__.py tests/test_api/__init__.py
```

**Step 5: Create placeholder main.py**
```python
# src/main.py
"""Deep Research Agent - FastAPI Application."""


def main() -> None:
    """Application entrypoint."""
    print("Deep Research Agent")


if __name__ == "__main__":
    main()
```

**Step 6: Initialize uv and install dependencies**
```bash
uv sync
```

**Step 7: Verify installation**
```bash
uv run python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
```

**Step 8: Commit**
```bash
git add -A
git commit -m "feat: setup uv package management and project structure"
git push
```

---

### Task 1.3: Setup Docker Configuration

**GitHub Issue:** `feat: add Docker configuration for development and production`

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `.env.example`

**Step 1: Create .dockerignore**
```
.git
.gitignore
.env
.env.*
.venv
venv
__pycache__
*.pyc
*.pyo
.pytest_cache
.mypy_cache
.ruff_cache
.coverage
htmlcov
dist
build
*.egg-info
docs
tests
README.md
Makefile
docker-compose*.yml
```

**Step 2: Create Dockerfile**
```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# -------------------
# Development stage
# -------------------
FROM base AS development

# Install dev dependencies
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Generate Prisma client
RUN uv run prisma generate

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -------------------
# Production stage
# -------------------
FROM base AS production

# Create non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Install production dependencies only
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

COPY --chown=appuser:appgroup . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Generate Prisma client
RUN uv run prisma generate

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health')" || exit 1

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 3: Create docker-compose.yml**
```yaml
services:
  app:
    build:
      context: .
      target: development
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - /app/.venv  # Exclude venv from mount
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/deepresearch
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    networks:
      - deepresearch

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: deepresearch
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - deepresearch

volumes:
  postgres_data:

networks:
  deepresearch:
    driver: bridge
```

**Step 4: Create .env.example**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deepresearch

# LLM (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key

# Tools
TAVILY_API_KEY=your_tavily_api_key
E2B_API_KEY=your_e2b_api_key

# Observability
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_HOST=https://cloud.langfuse.com

# Auth
JWT_SECRET=your_jwt_secret_change_in_production

# Agent Config
DEFAULT_HITL_MODE=sensitive
MAX_CONCURRENT_SUBAGENTS=3
MAX_DELEGATION_ROUNDS=3

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

**Step 5: Verify Docker build**
```bash
docker compose build
```

**Step 6: Commit**
```bash
git add -A
git commit -m "feat: add Docker configuration for development and production"
git push
```

---

### Task 1.4: Create GitHub Issues for Remaining Tasks

**GitHub Issue:** `chore: create GitHub issues for implementation tracking`

**Step 1: Create all issues**
```bash
# Phase 2: Database
gh issue create --title "feat: setup Prisma schema and client" --body "Create Prisma schema with User, Session, Report, Artifact, UsageLog models. Configure async client for FastAPI." --label "enhancement"

gh issue create --title "feat: implement database repositories" --body "Create repository classes for Users, Sessions, Reports with CRUD operations." --label "enhancement"

# Phase 3: Configuration
gh issue create --title "feat: add application configuration" --body "Create pydantic-settings based configuration with environment variable support." --label "enhancement"

# Phase 4: Agent Tools
gh issue create --title "feat: implement Tavily search tool" --body "Create tavily_search tool for web search with result formatting." --label "enhancement"

gh issue create --title "feat: implement URL fetch tool" --body "Create fetch_url tool with HTTP fetching and HTML to markdown conversion." --label "enhancement"

gh issue create --title "feat: implement PDF analysis tool" --body "Create analyze_pdf tool using PyMuPDF for text and image extraction." --label "enhancement"

gh issue create --title "feat: implement document analysis tool" --body "Create analyze_document tool for DOCX and XLSX files." --label "enhancement"

gh issue create --title "feat: implement E2B code execution tool" --body "Create e2b_execute tool for sandboxed Python execution." --label "enhancement"

gh issue create --title "feat: implement think tool" --body "Create think_tool for agent strategic reflection." --label "enhancement"

# Phase 5: Agent
gh issue create --title "feat: create agent prompts" --body "Define ORCHESTRATOR_PROMPT and RESEARCHER_PROMPT with workflow instructions." --label "enhancement"

gh issue create --title "feat: implement research sub-agent" --body "Create researcher sub-agent configuration for focused research tasks." --label "enhancement"

gh issue create --title "feat: implement main research agent graph" --body "Create main agent using deepagents create_deep_agent with tools, sub-agents, and HITL config." --label "enhancement"

# Phase 6: Services
gh issue create --title "feat: implement authentication service" --body "Create JWT and API key authentication with FastAPI dependencies." --label "enhancement"

gh issue create --title "feat: implement rate limiting service" --body "Create rate limiter with tier-based limits using database tracking." --label "enhancement"

gh issue create --title "feat: implement LangFuse callback" --body "Create LangFuse callback handler for observability." --label "enhancement"

# Phase 7: API
gh issue create --title "feat: create FastAPI application" --body "Setup FastAPI app with CORS, middleware, health endpoints." --label "enhancement"

gh issue create --title "feat: integrate AG-UI endpoint" --body "Add LangGraphAGUIAgent endpoint for CopilotKit integration." --label "enhancement"

gh issue create --title "feat: add session management API" --body "Create REST endpoints for session CRUD operations." --label "enhancement"

# Phase 8: Testing
gh issue create --title "test: add unit tests for tools" --body "Create unit tests for all agent tools with mocking." --label "testing"

gh issue create --title "test: add integration tests for agent" --body "Create integration tests for research agent workflow." --label "testing"

gh issue create --title "test: add API tests" --body "Create API tests for all endpoints." --label "testing"

# Phase 9: CI/CD
gh issue create --title "ci: setup GitHub Actions workflow" --body "Create CI workflow with linting, testing, and Docker build." --label "ci/cd"

gh issue create --title "feat: add Render deployment configuration" --body "Create render.yaml for deployment configuration." --label "enhancement"
```

**Step 2: List created issues**
```bash
gh issue list
```

**Step 3: Commit**
```bash
git add -A
git commit -m "chore: create GitHub issues for implementation tracking"
git push
```

---

## Phase 2: Database Layer

### Task 2.1: Setup Prisma Schema

**GitHub Issue:** `feat: setup Prisma schema and client`

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/db/client.py`

**Step 1: Create prisma directory**
```bash
mkdir -p prisma
```

**Step 2: Create schema.prisma**
```prisma
generator client {
  provider             = "prisma-client-py"
  interface            = "asyncio"
  recursive_type_depth = 5
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users & Auth
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  apiKey        String        @unique @default(cuid())
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  rateLimitTier RateLimitTier @default(FREE)

  sessions  Session[]
  usageLogs UsageLog[]
}

enum RateLimitTier {
  FREE
  PRO
  UNLIMITED
}

// Research Sessions
model Session {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  status    SessionStatus @default(ACTIVE)
  state     Json?
  messages  Json          @default("[]")
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  reports   Report[]
  artifacts Artifact[]

  @@index([userId, status])
}

enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
  FAILED
}

// Research Outputs
model Report {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  title     String
  markdown  String
  jsonData  Json
  sources   Json
  createdAt DateTime @default(now())

  @@index([sessionId])
}

model Artifact {
  id        String       @id @default(cuid())
  sessionId String
  session   Session      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  type      ArtifactType
  filename  String
  mimeType  String
  url       String?
  content   Bytes?
  metadata  Json?
  createdAt DateTime     @default(now())

  @@index([sessionId, type])
}

enum ArtifactType {
  CSV
  CHART
  CODE
  PDF
  IMAGE
  OTHER
}

// Usage & Rate Limiting
model UsageLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  tokens    Int?
  cost      Float?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([userId, action, createdAt])
}
```

**Step 3: Create src/db/client.py**
```python
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
```

**Step 4: Generate Prisma client**
```bash
uv run prisma generate
```

**Step 5: Create initial migration**
```bash
uv run prisma migrate dev --name init
```

**Step 6: Verify migration**
```bash
uv run prisma migrate status
```

**Step 7: Commit**
```bash
git add -A
git commit -m "feat: setup Prisma schema and client"
git push
```

**Step 8: Close issue**
```bash
gh issue close "feat: setup Prisma schema and client"
```

---

### Task 2.2: Implement Database Repositories

**GitHub Issue:** `feat: implement database repositories`

**Files:**
- Create: `src/db/repositories/users.py`
- Create: `src/db/repositories/sessions.py`
- Create: `src/db/repositories/reports.py`
- Create: `tests/test_db/__init__.py`
- Create: `tests/test_db/test_repositories.py`

**Step 1: Create tests directory**
```bash
mkdir -p tests/test_db
touch tests/test_db/__init__.py
```

**Step 2: Write failing test for UserRepository**
```python
# tests/test_db/test_repositories.py
"""Tests for database repositories."""

import pytest
from src.db.repositories.users import UserRepository
from src.db.client import prisma


@pytest.fixture
async def user_repo():
    """Create UserRepository instance."""
    await prisma.connect()
    yield UserRepository(prisma)
    await prisma.user.delete_many()
    await prisma.disconnect()


@pytest.mark.asyncio
async def test_create_user(user_repo: UserRepository):
    """Test user creation."""
    user = await user_repo.create(email="test@example.com", name="Test User")

    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.api_key is not None


@pytest.mark.asyncio
async def test_get_by_api_key(user_repo: UserRepository):
    """Test fetching user by API key."""
    created = await user_repo.create(email="test@example.com")

    user = await user_repo.get_by_api_key(created.api_key)

    assert user is not None
    assert user.id == created.id
```

**Step 3: Run test to verify it fails**
```bash
uv run pytest tests/test_db/test_repositories.py -v
```
Expected: FAIL with "No module named 'src.db.repositories.users'"

**Step 4: Implement UserRepository**
```python
# src/db/repositories/users.py
"""User repository for database operations."""

from prisma import Prisma
from prisma.models import User


class UserRepository:
    """Repository for User CRUD operations."""

    def __init__(self, db: Prisma) -> None:
        """Initialize with Prisma client."""
        self.db = db

    async def create(self, email: str, name: str | None = None) -> User:
        """Create a new user."""
        return await self.db.user.create(
            data={"email": email, "name": name}
        )

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
```

**Step 5: Implement SessionRepository**
```python
# src/db/repositories/sessions.py
"""Session repository for database operations."""

from typing import Any
from prisma import Prisma
from prisma.models import Session
from prisma.enums import SessionStatus


class SessionRepository:
    """Repository for Session CRUD operations."""

    def __init__(self, db: Prisma) -> None:
        """Initialize with Prisma client."""
        self.db = db

    async def create(self, user_id: str, title: str | None = None) -> Session:
        """Create a new session."""
        return await self.db.session.create(
            data={"userId": user_id, "title": title}
        )

    async def get_by_id(self, session_id: str) -> Session | None:
        """Get session by ID with relations."""
        return await self.db.session.find_unique(
            where={"id": session_id},
            include={"reports": True, "artifacts": True}
        )

    async def get_user_sessions(
        self, user_id: str, status: SessionStatus | None = None
    ) -> list[Session]:
        """Get all sessions for a user."""
        where: dict[str, Any] = {"userId": user_id}
        if status:
            where["status"] = status
        return await self.db.session.find_many(
            where=where,
            order={"createdAt": "desc"}
        )

    async def update_state(
        self, session_id: str, state: dict[str, Any], messages: list[dict[str, Any]]
    ) -> Session:
        """Update session state and messages."""
        return await self.db.session.update(
            where={"id": session_id},
            data={"state": state, "messages": messages}
        )

    async def update_status(self, session_id: str, status: SessionStatus) -> Session:
        """Update session status."""
        return await self.db.session.update(
            where={"id": session_id},
            data={"status": status}
        )

    async def delete(self, session_id: str) -> Session | None:
        """Delete session by ID."""
        return await self.db.session.delete(where={"id": session_id})
```

**Step 6: Implement ReportRepository**
```python
# src/db/repositories/reports.py
"""Report repository for database operations."""

from typing import Any
from prisma import Prisma
from prisma.models import Report


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
            where={"sessionId": session_id},
            order={"createdAt": "desc"}
        )

    async def delete(self, report_id: str) -> Report | None:
        """Delete report by ID."""
        return await self.db.report.delete(where={"id": report_id})
```

**Step 7: Update repository __init__.py**
```python
# src/db/repositories/__init__.py
"""Database repositories."""

from .users import UserRepository
from .sessions import SessionRepository
from .reports import ReportRepository

__all__ = ["UserRepository", "SessionRepository", "ReportRepository"]
```

**Step 8: Run tests**
```bash
uv run pytest tests/test_db/test_repositories.py -v
```
Expected: PASS

**Step 9: Commit**
```bash
git add -A
git commit -m "feat: implement database repositories"
git push
```

**Step 10: Close issue**
```bash
gh issue close "feat: implement database repositories"
```

---

## Phase 3: Configuration

### Task 3.1: Add Application Configuration

**GitHub Issue:** `feat: add application configuration`

**Files:**
- Create: `src/config.py`
- Create: `tests/test_config.py`

**Step 1: Write failing test**
```python
# tests/test_config.py
"""Tests for application configuration."""

import os
import pytest


def test_settings_loads_from_env(monkeypatch):
    """Test settings loads from environment variables."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("TAVILY_API_KEY", "tavily-key")
    monkeypatch.setenv("E2B_API_KEY", "e2b-key")
    monkeypatch.setenv("LANGFUSE_PUBLIC_KEY", "lf-public")
    monkeypatch.setenv("LANGFUSE_SECRET_KEY", "lf-secret")
    monkeypatch.setenv("JWT_SECRET", "jwt-secret")

    # Import after setting env vars
    from src.config import Settings

    settings = Settings()

    assert settings.database_url == "postgresql://test:test@localhost/test"
    assert settings.openrouter_api_key == "test-key"
    assert settings.default_hitl_mode == "sensitive"
```

**Step 2: Run test to verify it fails**
```bash
uv run pytest tests/test_config.py -v
```
Expected: FAIL

**Step 3: Implement configuration**
```python
# src/config.py
"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # LLM (OpenRouter)
    openrouter_api_key: str

    # Tools
    tavily_api_key: str
    e2b_api_key: str

    # Observability
    langfuse_public_key: str
    langfuse_secret_key: str
    langfuse_host: str = "https://cloud.langfuse.com"

    # Auth
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    # Agent Config
    default_hitl_mode: str = "sensitive"
    max_concurrent_subagents: int = 3
    max_delegation_rounds: int = 3

    # Rate Limits
    free_tier_rpm: int = 10
    free_tier_rpd: int = 100
    pro_tier_rpm: int = 60
    pro_tier_rpd: int = 1000

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

**Step 4: Run tests**
```bash
uv run pytest tests/test_config.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: add application configuration"
git push
```

**Step 6: Close issue**
```bash
gh issue close "feat: add application configuration"
```

---

## Phase 4: Agent Tools

### Task 4.1: Implement Think Tool

**GitHub Issue:** `feat: implement think tool`

**Files:**
- Create: `src/agent/tools/think.py`
- Create: `tests/test_agent/test_tools/__init__.py`
- Create: `tests/test_agent/test_tools/test_think.py`

**Step 1: Create test directory**
```bash
mkdir -p tests/test_agent/test_tools
touch tests/test_agent/test_tools/__init__.py
```

**Step 2: Write test**
```python
# tests/test_agent/test_tools/test_think.py
"""Tests for think tool."""

import pytest
from src.agent.tools.think import think_tool


def test_think_tool_returns_input():
    """Think tool should return acknowledgment."""
    result = think_tool.invoke({"thought": "I should search for more sources"})

    assert "thought" in result.lower() or "noted" in result.lower()
```

**Step 3: Run test to verify it fails**
```bash
uv run pytest tests/test_agent/test_tools/test_think.py -v
```

**Step 4: Implement think tool**
```python
# src/agent/tools/think.py
"""Think tool for agent strategic reflection."""

from langchain_core.tools import tool


@tool
def think_tool(thought: str) -> str:
    """Use this tool to pause and think strategically about your approach.

    Args:
        thought: Your strategic thinking about the current task.

    Returns:
        Acknowledgment of the thought.
    """
    return f"Thought noted: {thought}"
```

**Step 5: Run test**
```bash
uv run pytest tests/test_agent/test_tools/test_think.py -v
```
Expected: PASS

**Step 6: Commit**
```bash
git add -A
git commit -m "feat: implement think tool"
git push
```

**Step 7: Close issue**
```bash
gh issue close "feat: implement think tool"
```

---

### Task 4.2: Implement Tavily Search Tool

**GitHub Issue:** `feat: implement Tavily search tool`

**Files:**
- Create: `src/agent/tools/search.py`
- Create: `tests/test_agent/test_tools/test_search.py`

**Step 1: Write test**
```python
# tests/test_agent/test_tools/test_search.py
"""Tests for search tools."""

import pytest
from unittest.mock import patch, MagicMock


def test_tavily_search_returns_results():
    """Test tavily search returns formatted results."""
    mock_results = {
        "results": [
            {"title": "Test Result", "url": "https://example.com", "content": "Test content"}
        ]
    }

    with patch("src.agent.tools.search.TavilyClient") as mock_client:
        mock_instance = MagicMock()
        mock_instance.search.return_value = mock_results
        mock_client.return_value = mock_instance

        from src.agent.tools.search import tavily_search

        result = tavily_search.invoke({"query": "test query", "max_results": 5})

        assert "Test Result" in result
        assert "https://example.com" in result
```

**Step 2: Implement tavily search**
```python
# src/agent/tools/search.py
"""Web search tools using Tavily."""

import os
from langchain_core.tools import tool
from tavily import TavilyClient


def _get_tavily_client() -> TavilyClient:
    """Get Tavily client instance."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY environment variable not set")
    return TavilyClient(api_key=api_key)


@tool
def tavily_search(query: str, max_results: int = 5) -> str:
    """Search the web using Tavily for current information.

    Args:
        query: The search query.
        max_results: Maximum number of results to return (default 5).

    Returns:
        Formatted search results with titles, URLs, and snippets.
    """
    client = _get_tavily_client()

    response = client.search(
        query=query,
        max_results=max_results,
        include_answer=True,
    )

    results = []

    if response.get("answer"):
        results.append(f"**Quick Answer:** {response['answer']}\n")

    results.append("**Search Results:**\n")

    for i, result in enumerate(response.get("results", []), 1):
        title = result.get("title", "No title")
        url = result.get("url", "")
        content = result.get("content", "")[:300]

        results.append(f"{i}. **{title}**")
        results.append(f"   URL: {url}")
        results.append(f"   {content}...")
        results.append("")

    return "\n".join(results)
```

**Step 3: Run test**
```bash
uv run pytest tests/test_agent/test_tools/test_search.py -v
```
Expected: PASS

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: implement Tavily search tool"
git push
```

**Step 5: Close issue**
```bash
gh issue close "feat: implement Tavily search tool"
```

---

### Task 4.3: Implement URL Fetch Tool

**GitHub Issue:** `feat: implement URL fetch tool`

**Files:**
- Create: `src/agent/tools/fetch.py`
- Create: `tests/test_agent/test_tools/test_fetch.py`

**Step 1: Write test**
```python
# tests/test_agent/test_tools/test_fetch.py
"""Tests for URL fetch tool."""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.mark.asyncio
async def test_fetch_url_converts_to_markdown():
    """Test fetch_url converts HTML to markdown."""
    mock_html = "<html><body><h1>Test Title</h1><p>Test content</p></body></html>"

    with patch("src.agent.tools.fetch.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.text = mock_html
        mock_response.status_code = 200

        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_client.return_value = mock_instance

        from src.agent.tools.fetch import fetch_url

        result = await fetch_url.ainvoke({"url": "https://example.com"})

        assert "Test Title" in result or "test" in result.lower()
```

**Step 2: Implement fetch tool**
```python
# src/agent/tools/fetch.py
"""URL fetching and content extraction tools."""

import httpx
from langchain_core.tools import tool
from markdownify import markdownify as md


@tool
async def fetch_url(url: str, max_length: int = 50000) -> str:
    """Fetch a URL and convert its content to markdown.

    Args:
        url: The URL to fetch.
        max_length: Maximum content length to return (default 50000).

    Returns:
        The page content converted to markdown format.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DeepResearchAgent/1.0)"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            html_content = response.text

            # Convert HTML to markdown
            markdown_content = md(
                html_content,
                heading_style="ATX",
                strip=["script", "style", "nav", "footer", "header"],
            )

            # Clean up excessive whitespace
            lines = [line.strip() for line in markdown_content.split("\n")]
            cleaned = "\n".join(line for line in lines if line)

            # Truncate if necessary
            if len(cleaned) > max_length:
                cleaned = cleaned[:max_length] + "\n\n[Content truncated...]"

            return f"**Source:** {url}\n\n{cleaned}"

    except httpx.HTTPStatusError as e:
        return f"Error fetching URL: HTTP {e.response.status_code}"
    except httpx.RequestError as e:
        return f"Error fetching URL: {str(e)}"
```

**Step 3: Run test**
```bash
uv run pytest tests/test_agent/test_tools/test_fetch.py -v
```
Expected: PASS

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: implement URL fetch tool"
git push
```

**Step 5: Close issue**
```bash
gh issue close "feat: implement URL fetch tool"
```

---

### Task 4.4: Implement PDF Analysis Tool

**GitHub Issue:** `feat: implement PDF analysis tool`

**Files:**
- Create: `src/agent/tools/files.py`
- Create: `tests/test_agent/test_tools/test_files.py`

**Step 1: Write test**
```python
# tests/test_agent/test_tools/test_files.py
"""Tests for file analysis tools."""

import pytest
from unittest.mock import patch, MagicMock
import io


def test_analyze_pdf_extracts_text():
    """Test PDF text extraction."""
    with patch("src.agent.tools.files.fitz") as mock_fitz:
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Test PDF content"

        mock_doc = MagicMock()
        mock_doc.__iter__ = lambda self: iter([mock_page])
        mock_doc.__len__ = lambda self: 1

        mock_fitz.open.return_value = mock_doc

        from src.agent.tools.files import analyze_pdf

        result = analyze_pdf.invoke({"file_path": "/tmp/test.pdf"})

        assert "Test PDF content" in result
```

**Step 2: Implement file analysis tools**
```python
# src/agent/tools/files.py
"""File analysis tools for PDFs and documents."""

import fitz  # PyMuPDF
from docx import Document
from openpyxl import load_workbook
from langchain_core.tools import tool


@tool
def analyze_pdf(file_path: str, max_pages: int = 50) -> str:
    """Extract text content from a PDF file.

    Args:
        file_path: Path to the PDF file.
        max_pages: Maximum number of pages to process (default 50).

    Returns:
        Extracted text content from the PDF.
    """
    try:
        doc = fitz.open(file_path)

        pages_to_process = min(len(doc), max_pages)
        text_parts = []

        for i, page in enumerate(doc):
            if i >= pages_to_process:
                break
            text = page.get_text()
            if text.strip():
                text_parts.append(f"--- Page {i + 1} ---\n{text}")

        doc.close()

        if not text_parts:
            return "No text content found in PDF."

        result = "\n\n".join(text_parts)

        if len(doc) > max_pages:
            result += f"\n\n[Truncated: showing {max_pages} of {len(doc)} pages]"

        return result

    except Exception as e:
        return f"Error analyzing PDF: {str(e)}"


@tool
def analyze_document(file_path: str) -> str:
    """Extract content from DOCX or XLSX files.

    Args:
        file_path: Path to the document file.

    Returns:
        Extracted content from the document.
    """
    try:
        if file_path.endswith(".docx"):
            return _analyze_docx(file_path)
        elif file_path.endswith(".xlsx"):
            return _analyze_xlsx(file_path)
        else:
            return f"Unsupported file type: {file_path}"
    except Exception as e:
        return f"Error analyzing document: {str(e)}"


def _analyze_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _analyze_xlsx(file_path: str) -> str:
    """Extract data from XLSX file."""
    wb = load_workbook(file_path, read_only=True)

    results = []
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        results.append(f"## Sheet: {sheet_name}\n")

        rows = []
        for row in sheet.iter_rows(values_only=True):
            row_str = " | ".join(str(cell) if cell else "" for cell in row)
            if row_str.strip(" |"):
                rows.append(row_str)

        results.append("\n".join(rows[:100]))  # Limit rows

        if len(rows) > 100:
            results.append(f"\n[Truncated: showing 100 of {len(rows)} rows]")

    wb.close()
    return "\n\n".join(results)
```

**Step 3: Run test**
```bash
uv run pytest tests/test_agent/test_tools/test_files.py -v
```
Expected: PASS

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: implement PDF and document analysis tools"
git push
```

**Step 5: Close issues**
```bash
gh issue close "feat: implement PDF analysis tool"
gh issue close "feat: implement document analysis tool"
```

---

### Task 4.5: Implement E2B Code Execution Tool

**GitHub Issue:** `feat: implement E2B code execution tool`

**Files:**
- Create: `src/agent/tools/code_exec.py`
- Create: `tests/test_agent/test_tools/test_code_exec.py`

**Step 1: Write test**
```python
# tests/test_agent/test_tools/test_code_exec.py
"""Tests for code execution tool."""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.mark.asyncio
async def test_e2b_execute_returns_output():
    """Test E2B code execution returns output."""
    with patch("src.agent.tools.code_exec.Sandbox") as mock_sandbox:
        mock_execution = MagicMock()
        mock_execution.logs.stdout = ["Hello, World!"]
        mock_execution.logs.stderr = []
        mock_execution.error = None
        mock_execution.results = []

        mock_instance = MagicMock()
        mock_instance.run_code.return_value = mock_execution
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)

        mock_sandbox.return_value = mock_instance

        from src.agent.tools.code_exec import e2b_execute

        result = e2b_execute.invoke({"code": "print('Hello, World!')"})

        assert "Hello, World!" in result
```

**Step 2: Implement E2B tool**
```python
# src/agent/tools/code_exec.py
"""Sandboxed code execution using E2B."""

import os
from langchain_core.tools import tool
from e2b_code_interpreter import Sandbox


@tool
def e2b_execute(code: str, timeout: int = 60) -> str:
    """Execute Python code in a secure E2B sandbox.

    Use this for data analysis, calculations, chart generation, or any
    code that needs to run safely in isolation.

    Args:
        code: Python code to execute.
        timeout: Maximum execution time in seconds (default 60).

    Returns:
        Execution output including stdout, stderr, and any generated artifacts.
    """
    api_key = os.getenv("E2B_API_KEY")
    if not api_key:
        return "Error: E2B_API_KEY environment variable not set"

    try:
        with Sandbox(api_key=api_key, timeout=timeout) as sandbox:
            execution = sandbox.run_code(code)

            output_parts = []

            # Collect stdout
            if execution.logs.stdout:
                stdout = "".join(execution.logs.stdout)
                output_parts.append(f"**Output:**\n```\n{stdout}\n```")

            # Collect stderr
            if execution.logs.stderr:
                stderr = "".join(execution.logs.stderr)
                output_parts.append(f"**Errors:**\n```\n{stderr}\n```")

            # Check for execution error
            if execution.error:
                output_parts.append(f"**Execution Error:**\n{execution.error}")

            # Collect results (charts, dataframes, etc.)
            if execution.results:
                for i, result in enumerate(execution.results):
                    if hasattr(result, "png") and result.png:
                        output_parts.append(f"**Chart {i + 1}:** [Image generated]")
                    elif hasattr(result, "text") and result.text:
                        output_parts.append(f"**Result {i + 1}:**\n{result.text}")

            if not output_parts:
                return "Code executed successfully with no output."

            return "\n\n".join(output_parts)

    except Exception as e:
        return f"Error executing code: {str(e)}"
```

**Step 3: Run test**
```bash
uv run pytest tests/test_agent/test_tools/test_code_exec.py -v
```
Expected: PASS

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: implement E2B code execution tool"
git push
```

**Step 5: Close issue**
```bash
gh issue close "feat: implement E2B code execution tool"
```

---

### Task 4.6: Export All Tools

**Files:**
- Modify: `src/agent/tools/__init__.py`

**Step 1: Update tools init**
```python
# src/agent/tools/__init__.py
"""Agent tools for research operations."""

from .think import think_tool
from .search import tavily_search
from .fetch import fetch_url
from .files import analyze_pdf, analyze_document
from .code_exec import e2b_execute

__all__ = [
    "think_tool",
    "tavily_search",
    "fetch_url",
    "analyze_pdf",
    "analyze_document",
    "e2b_execute",
]
```

**Step 2: Commit**
```bash
git add -A
git commit -m "feat: export all agent tools"
git push
```

---

## Phase 5: Agent Core

### Task 5.1: Create Agent Prompts

**GitHub Issue:** `feat: create agent prompts`

**Files:**
- Create: `src/agent/prompts.py`

**Step 1: Create prompts**
```python
# src/agent/prompts.py
"""System prompts for research agents."""

from datetime import date

CURRENT_DATE = date.today().isoformat()

ORCHESTRATOR_PROMPT = f"""You are a deep research orchestrator. Today's date: {CURRENT_DATE}

## Your Workflow

1. **PLAN**: Use think_tool to understand the request, then write_todos to create a research plan
2. **DELEGATE**: Assign focused research tasks to the researcher sub-agent (max 3 concurrent)
3. **ANALYZE**: For data-heavy tasks, use e2b_execute for Python analysis
4. **SYNTHESIZE**: Consolidate findings, deduplicate sources, identify gaps
5. **REPORT**: Generate comprehensive output with citations

## Delegation Strategy

- Simple queries: 1 researcher
- Comparisons: 1 researcher per item being compared
- Multi-faceted topics: 1 researcher per major aspect
- Maximum 3 concurrent researchers, 3 delegation rounds

## Output Format

Generate THREE outputs:
1. **Markdown report** with inline citations [1], [2], consolidated sources at end
2. **JSON data** with structured findings, confidence scores, source metadata
3. **Artifacts** (charts, CSVs, code) saved via file tools

Use clear section headings (## for sections, ### for subsections).
Be thorough but concise. No meta-commentary about the research process.
"""

RESEARCHER_PROMPT = f"""You are a focused research agent. Today's date: {CURRENT_DATE}

## Your Task
Research a SINGLE topic thoroughly. You receive one focused query from the orchestrator.

## Approach
1. Start with tavily_search for broad discovery
2. Use fetch_url to get full content from promising sources
3. Use think_tool to assess findings and plan next steps
4. Use analyze_pdf for academic papers or reports

## Limits
- Simple queries: 2-3 searches max
- Complex queries: up to 5 searches
- Always pause after each search to evaluate progress

## Output
Return findings with inline citations [1], [2], [3].
Include a sources list at the end with URLs.
Focus on facts, data, and expert opinions.
"""
```

**Step 2: Commit**
```bash
git add -A
git commit -m "feat: create agent prompts"
git push
```

**Step 3: Close issue**
```bash
gh issue close "feat: create agent prompts"
```

---

### Task 5.2: Implement Research Sub-agent

**GitHub Issue:** `feat: implement research sub-agent`

**Files:**
- Create: `src/agent/subagents/researcher.py`

**Step 1: Create researcher sub-agent config**
```python
# src/agent/subagents/researcher.py
"""Research sub-agent configuration."""

from typing import Any
from langchain_core.language_models import BaseChatModel

from ..prompts import RESEARCHER_PROMPT
from ..tools import tavily_search, fetch_url, analyze_pdf, analyze_document, think_tool


def get_researcher_config(model: BaseChatModel) -> dict[str, Any]:
    """Get researcher sub-agent configuration.

    Args:
        model: The LLM to use for the researcher.

    Returns:
        Sub-agent configuration dictionary for deepagents.
    """
    return {
        "name": "researcher",
        "description": "Conducts focused research on a single topic. Give this agent one specific research question at a time.",
        "system_prompt": RESEARCHER_PROMPT,
        "tools": [
            tavily_search,
            fetch_url,
            analyze_pdf,
            analyze_document,
            think_tool,
        ],
        "model": model,
    }
```

**Step 2: Update subagents init**
```python
# src/agent/subagents/__init__.py
"""Research sub-agents."""

from .researcher import get_researcher_config

__all__ = ["get_researcher_config"]
```

**Step 3: Commit**
```bash
git add -A
git commit -m "feat: implement research sub-agent"
git push
```

**Step 4: Close issue**
```bash
gh issue close "feat: implement research sub-agent"
```

---

### Task 5.3: Implement Main Research Agent

**GitHub Issue:** `feat: implement main research agent graph`

**Files:**
- Create: `src/agent/graph.py`
- Create: `tests/test_agent/test_graph.py`

**Step 1: Write test**
```python
# tests/test_agent/test_graph.py
"""Tests for research agent graph."""

import pytest
from unittest.mock import patch, MagicMock


def test_create_research_agent_returns_graph():
    """Test agent creation returns a compiled graph."""
    with patch("src.agent.graph.create_deep_agent") as mock_create:
        mock_graph = MagicMock()
        mock_create.return_value = mock_graph

        from src.agent.graph import create_research_agent, HITLMode

        graph = create_research_agent(hitl_mode=HITLMode.NONE)

        assert graph is not None
        mock_create.assert_called_once()


def test_hitl_mode_sensitive_interrupts_code_exec():
    """Test sensitive mode configures interrupt on code execution."""
    with patch("src.agent.graph.create_deep_agent") as mock_create:
        mock_graph = MagicMock()
        mock_create.return_value = mock_graph

        from src.agent.graph import create_research_agent, HITLMode

        create_research_agent(hitl_mode=HITLMode.SENSITIVE)

        call_kwargs = mock_create.call_args.kwargs
        assert "interrupt_on" in call_kwargs
        assert "e2b_execute" in call_kwargs["interrupt_on"]
```

**Step 2: Implement agent graph**
```python
# src/agent/graph.py
"""Main research agent graph using deepagents."""

import os
from enum import Enum
from typing import Any
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import BaseCallbackHandler
from deepagents import create_deep_agent

from .prompts import ORCHESTRATOR_PROMPT
from .tools import (
    tavily_search,
    fetch_url,
    analyze_pdf,
    analyze_document,
    e2b_execute,
    think_tool,
)
from .subagents import get_researcher_config


class HITLMode(str, Enum):
    """Human-in-the-loop modes."""

    NONE = "none"
    SENSITIVE = "sensitive"
    CHECKPOINTS = "checkpoints"
    FULL = "full"


def get_model() -> ChatOpenAI:
    """Initialize MiMo V2 Flash via OpenRouter."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")

    return ChatOpenAI(
        model="xiaomi/mimo-v2-flash:free",
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        temperature=0.0,
        max_tokens=65536,
        model_kwargs={
            "extra_body": {"reasoning": {"enabled": True}}
        },
    )


def create_research_agent(
    hitl_mode: HITLMode = HITLMode.SENSITIVE,
    callbacks: list[BaseCallbackHandler] | None = None,
) -> Any:
    """Create the deep research agent.

    Args:
        hitl_mode: Human-in-the-loop configuration.
        callbacks: Optional list of callback handlers (e.g., LangFuse).

    Returns:
        Compiled LangGraph agent.
    """
    model = get_model()

    # All tools available to orchestrator
    all_tools = [
        tavily_search,
        fetch_url,
        analyze_pdf,
        analyze_document,
        e2b_execute,
        think_tool,
    ]

    # Sensitive tools that may require approval
    sensitive_tools = [e2b_execute]

    # Configure interrupt points
    interrupt_config = _build_interrupt_config(hitl_mode, sensitive_tools)

    # Get researcher sub-agent config
    researcher = get_researcher_config(model)

    # Create the agent
    graph = create_deep_agent(
        model=model,
        system_prompt=ORCHESTRATOR_PROMPT,
        tools=all_tools,
        subagents=[researcher],
        interrupt_on=interrupt_config,
        callbacks=callbacks or [],
    )

    return graph


def _build_interrupt_config(
    mode: HITLMode,
    sensitive_tools: list[Any],
) -> dict[str, Any]:
    """Build interrupt configuration based on HITL mode."""
    if mode == HITLMode.NONE:
        return {}

    if mode == HITLMode.FULL:
        return {"*": {"allowed_decisions": ["approve", "reject", "modify"]}}

    if mode == HITLMode.SENSITIVE:
        return {
            tool.__name__: {"allowed_decisions": ["approve", "reject"]}
            for tool in sensitive_tools
        }

    if mode == HITLMode.CHECKPOINTS:
        return {
            "synthesis_checkpoint": {
                "allowed_decisions": ["approve", "reject", "continue_research"]
            }
        }

    return {}
```

**Step 3: Update agent init**
```python
# src/agent/__init__.py
"""Deep research agent."""

from .graph import create_research_agent, HITLMode

__all__ = ["create_research_agent", "HITLMode"]
```

**Step 4: Run tests**
```bash
uv run pytest tests/test_agent/test_graph.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: implement main research agent graph"
git push
```

**Step 6: Close issue**
```bash
gh issue close "feat: implement main research agent graph"
```

---

## Phase 6: Services

### Task 6.1: Implement LangFuse Callback

**GitHub Issue:** `feat: implement LangFuse callback`

**Files:**
- Create: `src/services/langfuse_callback.py`

**Step 1: Create LangFuse callback**
```python
# src/services/langfuse_callback.py
"""LangFuse observability integration."""

import os
from langfuse.callback import CallbackHandler as LangfuseCallbackHandler


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
```

**Step 2: Update services init**
```python
# src/services/__init__.py
"""Application services."""

from .langfuse_callback import create_langfuse_callback

__all__ = ["create_langfuse_callback"]
```

**Step 3: Commit**
```bash
git add -A
git commit -m "feat: implement LangFuse callback"
git push
```

**Step 4: Close issue**
```bash
gh issue close "feat: implement LangFuse callback"
```

---

### Task 6.2: Implement Authentication Service

**GitHub Issue:** `feat: implement authentication service`

**Files:**
- Create: `src/services/auth.py`
- Create: `tests/test_services/__init__.py`
- Create: `tests/test_services/test_auth.py`

**Step 1: Create test directory and test**
```bash
mkdir -p tests/test_services
touch tests/test_services/__init__.py
```

```python
# tests/test_services/test_auth.py
"""Tests for authentication service."""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.mark.asyncio
async def test_get_current_user_with_valid_api_key():
    """Test authentication with valid API key."""
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.email = "test@example.com"

    with patch("src.services.auth.prisma") as mock_prisma:
        mock_prisma.user.find_unique = AsyncMock(return_value=mock_user)

        from src.services.auth import get_user_by_api_key

        user = await get_user_by_api_key("valid-key")

        assert user is not None
        assert user.id == "user-123"
```

**Step 2: Implement auth service**
```python
# src/services/auth.py
"""Authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
from pydantic import BaseModel

from src.config import get_settings
from src.db.client import prisma
from prisma.models import User


class TokenData(BaseModel):
    """JWT token payload."""

    user_id: str
    exp: datetime


async def get_user_by_api_key(api_key: str) -> User | None:
    """Get user by API key.

    Args:
        api_key: The API key to look up.

    Returns:
        User if found, None otherwise.
    """
    return await prisma.user.find_unique(where={"apiKey": api_key})


def create_access_token(user_id: str) -> str:
    """Create JWT access token.

    Args:
        user_id: The user ID to encode.

    Returns:
        Encoded JWT token.
    """
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)

    payload = {"user_id": user_id, "exp": expire}

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenData | None:
    """Decode JWT access token.

    Args:
        token: The JWT token to decode.

    Returns:
        TokenData if valid, None otherwise.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return TokenData(user_id=payload["user_id"], exp=payload["exp"])
    except JWTError:
        return None


async def get_current_user(
    x_api_key: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Get current authenticated user.

    Supports both API key and JWT authentication.

    Args:
        x_api_key: Optional API key header.
        authorization: Optional Bearer token header.

    Returns:
        Authenticated user.

    Raises:
        HTTPException: If authentication fails.
    """
    # Try API key first
    if x_api_key:
        user = await get_user_by_api_key(x_api_key)
        if user:
            return user

    # Try JWT token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        token_data = decode_access_token(token)

        if token_data:
            user = await prisma.user.find_unique(where={"id": token_data.user_id})
            if user:
                return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


# FastAPI dependency
CurrentUser = Annotated[User, Depends(get_current_user)]
```

**Step 3: Run test**
```bash
uv run pytest tests/test_services/test_auth.py -v
```
Expected: PASS

**Step 4: Update services init**
```python
# src/services/__init__.py
"""Application services."""

from .langfuse_callback import create_langfuse_callback
from .auth import get_current_user, CurrentUser, create_access_token

__all__ = [
    "create_langfuse_callback",
    "get_current_user",
    "CurrentUser",
    "create_access_token",
]
```

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: implement authentication service"
git push
```

**Step 6: Close issue**
```bash
gh issue close "feat: implement authentication service"
```

---

### Task 6.3: Implement Rate Limiting Service

**GitHub Issue:** `feat: implement rate limiting service`

**Files:**
- Create: `src/services/rate_limiter.py`

**Step 1: Implement rate limiter**
```python
# src/services/rate_limiter.py
"""Rate limiting service using database tracking."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from prisma.models import User
from prisma.enums import RateLimitTier

from src.config import get_settings
from src.db.client import prisma
from src.services.auth import get_current_user


async def check_rate_limit(user: User) -> bool:
    """Check if user is within rate limits.

    Args:
        user: The user to check.

    Returns:
        True if within limits.

    Raises:
        HTTPException: If rate limit exceeded.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)

    # Get limits based on tier
    if user.rateLimitTier == RateLimitTier.UNLIMITED:
        return True
    elif user.rateLimitTier == RateLimitTier.PRO:
        rpm_limit = settings.pro_tier_rpm
        rpd_limit = settings.pro_tier_rpd
    else:  # FREE
        rpm_limit = settings.free_tier_rpm
        rpd_limit = settings.free_tier_rpd

    # Check requests per minute
    minute_ago = now - timedelta(minutes=1)
    rpm_count = await prisma.usagelog.count(
        where={
            "userId": user.id,
            "createdAt": {"gte": minute_ago},
        }
    )

    if rpm_count >= rpm_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {rpm_limit} requests per minute",
        )

    # Check requests per day
    day_ago = now - timedelta(days=1)
    rpd_count = await prisma.usagelog.count(
        where={
            "userId": user.id,
            "createdAt": {"gte": day_ago},
        }
    )

    if rpd_count >= rpd_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {rpd_limit} requests per day",
        )

    return True


async def log_usage(
    user_id: str,
    action: str,
    tokens: int | None = None,
    cost: float | None = None,
) -> None:
    """Log API usage for rate limiting and billing.

    Args:
        user_id: The user ID.
        action: The action performed.
        tokens: Optional token count.
        cost: Optional estimated cost.
    """
    await prisma.usagelog.create(
        data={
            "userId": user_id,
            "action": action,
            "tokens": tokens,
            "cost": cost,
        }
    )


async def rate_limit_dependency(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """FastAPI dependency that checks rate limits.

    Args:
        user: The authenticated user.

    Returns:
        The user if within limits.
    """
    await check_rate_limit(user)
    return user


RateLimitedUser = Annotated[User, Depends(rate_limit_dependency)]
```

**Step 2: Update services init**
```python
# src/services/__init__.py
"""Application services."""

from .langfuse_callback import create_langfuse_callback
from .auth import get_current_user, CurrentUser, create_access_token
from .rate_limiter import RateLimitedUser, log_usage, check_rate_limit

__all__ = [
    "create_langfuse_callback",
    "get_current_user",
    "CurrentUser",
    "create_access_token",
    "RateLimitedUser",
    "log_usage",
    "check_rate_limit",
]
```

**Step 3: Commit**
```bash
git add -A
git commit -m "feat: implement rate limiting service"
git push
```

**Step 4: Close issue**
```bash
gh issue close "feat: implement rate limiting service"
```

---

## Phase 7: API Layer

### Task 7.1: Create FastAPI Application

**GitHub Issue:** `feat: create FastAPI application`

**Files:**
- Create: `src/api/routes.py`
- Modify: `src/main.py`

**Step 1: Create routes**
```python
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
```

**Step 2: Update main.py**
```python
# src/main.py
"""Deep Research Agent - FastAPI Application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.db.client import connect_db, disconnect_db
from src.api.routes import router


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
        version="0.1.0",
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
```

**Step 3: Update api init**
```python
# src/api/__init__.py
"""API module."""

from .routes import router

__all__ = ["router"]
```

**Step 4: Test health endpoint**
```bash
# Start database
docker compose up -d db

# Run migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deepresearch uv run prisma migrate deploy

# Run app (in another terminal, with env vars)
uv run python -m src.main

# Test health endpoint
curl http://localhost:8000/health
```
Expected: `{"status": "ok"}`

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: create FastAPI application"
git push
```

**Step 6: Close issue**
```bash
gh issue close "feat: create FastAPI application"
```

---

### Task 7.2: Integrate AG-UI Endpoint

**GitHub Issue:** `feat: integrate AG-UI endpoint`

**Files:**
- Create: `src/api/agent_endpoint.py`
- Modify: `src/main.py`

**Step 1: Create agent endpoint**
```python
# src/api/agent_endpoint.py
"""AG-UI agent endpoint for CopilotKit integration."""

from fastapi import FastAPI
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from src.agent import create_research_agent, HITLMode
from src.config import get_settings
from src.services import create_langfuse_callback


def setup_agent_endpoint(app: FastAPI) -> None:
    """Setup AG-UI agent endpoint on FastAPI app.

    Args:
        app: The FastAPI application.
    """
    settings = get_settings()

    # Create LangFuse callback if configured
    callbacks = []
    langfuse_cb = create_langfuse_callback()
    if langfuse_cb:
        callbacks.append(langfuse_cb)

    # Create research agent
    hitl_mode = HITLMode(settings.default_hitl_mode)
    graph = create_research_agent(hitl_mode=hitl_mode, callbacks=callbacks)

    # Add AG-UI endpoint
    add_langgraph_fastapi_endpoint(
        app=app,
        agent=LangGraphAGUIAgent(
            name="deep_research",
            description="Deep research agent with web search, document analysis, and code execution",
            graph=graph,
        ),
        path="/agent/research",
    )
```

**Step 2: Update main.py to include agent endpoint**
```python
# src/main.py
"""Deep Research Agent - FastAPI Application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.db.client import connect_db, disconnect_db
from src.api.routes import router
from src.api.agent_endpoint import setup_agent_endpoint


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
        version="0.1.0",
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

    # Setup agent endpoint
    setup_agent_endpoint(app)

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
```

**Step 3: Commit**
```bash
git add -A
git commit -m "feat: integrate AG-UI endpoint"
git push
```

**Step 4: Close issue**
```bash
gh issue close "feat: integrate AG-UI endpoint"
```

---

### Task 7.3: Add Session Management API

**GitHub Issue:** `feat: add session management API`

**Files:**
- Create: `src/api/sessions.py`
- Create: `src/models/schemas.py`
- Modify: `src/main.py`

**Step 1: Create Pydantic schemas**
```python
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
```

**Step 2: Create sessions router**
```python
# src/api/sessions.py
"""Session management API routes."""

from fastapi import APIRouter, HTTPException, status

from src.db.client import prisma
from src.db.repositories import SessionRepository, ReportRepository
from src.services import CurrentUser, RateLimitedUser, log_usage
from src.models.schemas import (
    SessionCreate,
    SessionResponse,
    SessionListResponse,
    ReportResponse,
)

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
```

**Step 3: Update main.py to include sessions router**
```python
# Add to imports in src/main.py
from src.api.sessions import router as sessions_router

# Add in create_app() after app.include_router(router)
app.include_router(sessions_router)
```

**Step 4: Update models init**
```python
# src/models/__init__.py
"""Data models."""

from .schemas import (
    SessionCreate,
    SessionResponse,
    SessionListResponse,
    ReportResponse,
)

__all__ = [
    "SessionCreate",
    "SessionResponse",
    "SessionListResponse",
    "ReportResponse",
]
```

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: add session management API"
git push
```

**Step 6: Close issue**
```bash
gh issue close "feat: add session management API"
```

---

## Phase 8: CI/CD

### Task 8.1: Setup GitHub Actions Workflow

**GitHub Issue:** `ci: setup GitHub Actions workflow`

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create workflows directory**
```bash
mkdir -p .github/workflows
```

**Step 2: Create CI workflow**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: "3.11"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        run: uv python install ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: uv sync --frozen --dev

      - name: Run ruff
        run: uv run ruff check src tests

      - name: Run ruff format check
        run: uv run ruff format --check src tests

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        run: uv python install ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: uv sync --frozen --dev

      - name: Generate Prisma client
        run: uv run prisma generate

      - name: Run mypy
        run: uv run mypy src

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: deepresearch_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/deepresearch_test
      OPENROUTER_API_KEY: test-key
      TAVILY_API_KEY: test-key
      E2B_API_KEY: test-key
      LANGFUSE_PUBLIC_KEY: test-key
      LANGFUSE_SECRET_KEY: test-key
      JWT_SECRET: test-secret

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        run: uv python install ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: uv sync --frozen --dev

      - name: Generate Prisma client
        run: uv run prisma generate

      - name: Run migrations
        run: uv run prisma migrate deploy

      - name: Run tests
        run: uv run pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage.xml
          fail_ci_if_error: false

  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Step 3: Commit**
```bash
git add -A
git commit -m "ci: setup GitHub Actions workflow"
git push
```

**Step 4: Close issue**
```bash
gh issue close "ci: setup GitHub Actions workflow"
```

---

### Task 8.2: Add Render Deployment Configuration

**GitHub Issue:** `feat: add Render deployment configuration`

**Files:**
- Create: `render.yaml`

**Step 1: Create render.yaml**
```yaml
# render.yaml
services:
  - type: web
    name: deep-research-agent
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    dockerTarget: production
    plan: starter

    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: deep-research-db
          property: connectionString
      - key: OPENROUTER_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
      - key: E2B_API_KEY
        sync: false
      - key: LANGFUSE_PUBLIC_KEY
        sync: false
      - key: LANGFUSE_SECRET_KEY
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: ALLOWED_ORIGINS
        value: https://your-frontend-domain.com

    healthCheckPath: /health

    buildCommand: |
      uv run prisma generate &&
      uv run prisma migrate deploy

databases:
  - name: deep-research-db
    plan: starter
    databaseName: deepresearch
    user: deepresearch
```

**Step 2: Commit**
```bash
git add -A
git commit -m "feat: add Render deployment configuration"
git push
```

**Step 3: Close issue**
```bash
gh issue close "feat: add Render deployment configuration"
```

---

## Summary

This implementation plan covers:

1. **Phase 1: Project Foundation** - GitHub repo, uv, Docker
2. **Phase 2: Database Layer** - Prisma schema, repositories
3. **Phase 3: Configuration** - pydantic-settings
4. **Phase 4: Agent Tools** - think, search, fetch, PDF, docs, E2B
5. **Phase 5: Agent Core** - prompts, sub-agent, main graph
6. **Phase 6: Services** - auth, rate limiting, LangFuse
7. **Phase 7: API Layer** - FastAPI, AG-UI, sessions API
8. **Phase 8: CI/CD** - GitHub Actions, Render config

Each task creates a GitHub issue for tracking and follows TDD principles with bite-sized commits.
