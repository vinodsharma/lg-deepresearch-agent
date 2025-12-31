# Deep Research Agent — Design Document

## 1. Overview

A general-purpose deep research agent that autonomously investigates topics using web search, document analysis, and code execution, then synthesizes findings into comprehensive reports.

## 2. Goals

- Answer complex research questions with cited sources
- Support multi-step, multi-source investigation
- Provide structured outputs (markdown, JSON, artifacts)
- Enable human oversight at configurable checkpoints

## 3. Architecture

```
┌──────────────┐      AG-UI       ┌─────────────────────────────────┐
│ CopilotKit   │◄────Protocol────►│ FastAPI Backend                 │
│ React UI     │                  │ (Render)                        │
└──────────────┘                  │                                 │
                                  │  ┌───────────────────────────┐  │
                                  │  │ Deep Research Agent       │  │
                                  │  │ (LangGraph/deepagents)    │  │
                                  │  │                           │  │
                                  │  │  Orchestrator             │  │
                                  │  │      ├── Researcher ×3    │  │
                                  │  │      └── Tools            │  │
                                  │  └───────────────────────────┘  │
                                  └─────────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────┐
              ▼                            ▼                        ▼
        ┌──────────┐               ┌──────────────┐          ┌──────────┐
        │ Tavily   │               │ PostgreSQL   │          │   E2B    │
        │ (search) │               │ (Render)     │          │ (sandbox)│
        └──────────┘               └──────────────┘          └──────────┘
```

## 4. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | deepagents | Built-in sub-agent delegation, middleware, LangGraph-based |
| LLM | MiMo V2 Flash (OpenRouter) | Free tier, 262K context, reasoning mode for deep thinking |
| UI integration | CopilotKit + AG-UI | Standard protocol, streaming, HITL support |
| Database | PostgreSQL + Prisma | Migration DX, async support, session persistence |
| Code execution | E2B | Secure cloud sandboxes, free tier available |
| Observability | LangFuse | Open-source, LangChain integration |

## 5. Infrastructure & Tooling

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Version Control** | GitHub | Industry standard, CI/CD integration |
| **Package Manager** | uv | Fast, reliable, replaces pip/poetry |
| **Containerization** | Docker-first | Consistent dev/prod parity, easy deployment |
| **Hosting** | Render | Simple deployment, managed PostgreSQL, auto-scaling |
| **CI/CD** | GitHub Actions | Native GitHub integration, free tier |

## 6. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          GitHub                                  │
│  ┌───────────────┐    ┌───────────────┐    ┌────────────────┐   │
│  │ main branch   │───►│ GitHub Actions│───►│ Deploy to      │   │
│  │               │    │ (build/test)  │    │ Render         │   │
│  └───────────────┘    └───────────────┘    └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Render                                  │
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │ Web Service     │         │ PostgreSQL      │                │
│  │ (Docker)        │◄───────►│ (Managed)       │                │
│  │                 │         │                 │                │
│  │ - FastAPI       │         └─────────────────┘                │
│  │ - Deep Agent    │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Docker Configuration

```
lg-deepresearch-agent/
├── Dockerfile              # Production image
├── docker-compose.yml      # Local dev (API + PostgreSQL)
├── docker-compose.test.yml # CI testing
└── .dockerignore
```

**Container strategy:**
- Multi-stage build (uv install → slim runtime)
- Non-root user for security
- Health check endpoint
- Environment-based configuration

## 8. Data Model

- **Users** — Auth, API keys, rate limit tiers
- **Sessions** — Conversation state, LangGraph checkpoints
- **Reports** — Markdown + JSON outputs per session
- **Artifacts** — Generated files (charts, CSVs, code)
- **UsageLogs** — For rate limiting and cost tracking

## 9. Research Workflow

1. **Plan** — Orchestrator creates TODO list from user query
2. **Delegate** — Spawns up to 3 researcher sub-agents in parallel
3. **Gather** — Each researcher searches, fetches URLs, analyzes documents
4. **Analyze** — Optional code execution for data processing
5. **Synthesize** — Orchestrator merges findings, deduplicates sources
6. **Output** — Generates markdown report, JSON data, and artifacts

## 10. Human-in-the-Loop Modes

| Mode | Behavior |
|------|----------|
| `none` | Fully autonomous |
| `sensitive` | Approve code execution, file writes (default) |
| `checkpoints` | Pause after research phase |
| `full` | Approve every tool call |

## 11. Capabilities

- **Web search** — Tavily API
- **URL fetching** — Full page content → markdown
- **PDF analysis** — Text and image extraction
- **Document analysis** — DOCX, XLSX parsing
- **Code execution** — Sandboxed Python (E2B)
- **Multi-user** — Isolated sessions per user
- **Persistence** — Resume sessions across restarts
