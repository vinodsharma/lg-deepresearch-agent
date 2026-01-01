# Deployment Guide

This project uses GitHub Actions for CI/CD with Render as the hosting platform.

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | `main` | `https://deep-research-agent.onrender.com` | Live production environment |
| Staging | `staging` | `https://deep-research-agent-staging.onrender.com` | Pre-production testing |
| Preview | `feature/*`, `fix/*`, `chore/*`, etc. | `https://deep-research-agent-preview.onrender.com` | Feature branch testing |

## Workflow Overview

```
feature/* ─┬─► Push ──► Preview Environment (fixed)
fix/*      │            https://deep-research-agent-preview.onrender.com
chore/*    │
hotfix/*   │
bugfix/*   │
refactor/* │
test/*     │
docs/*    ─┘
              │
              ▼ (merge)
           staging ──► Staging Environment
              │
              ▼ (merge)
            main ──► Production Environment
```

## Workflows

### 1. CI (`ci.yml`)
- **Triggers**: Push to any branch except `main`/`staging`, PRs to `main`/`staging`
- **Jobs**: Lint, Type Check, Test, Docker Build
- **Purpose**: Validate code quality before merge

### 2. Production Deploy (`deploy-production.yml`)
- **Triggers**: Push to `main`
- **Jobs**: Test → Build → Deploy
- **Concurrency**: Only one production deploy at a time (no cancellation)

### 3. Staging Deploy (`deploy-staging.yml`)
- **Triggers**: Push to `staging`
- **Jobs**: Test → Build → Deploy
- **Concurrency**: Cancels in-progress staging deploys

### 4. Preview Deploy (`deploy-preview.yml`)
- **Triggers**: Push to `feature/**`, `fix/**`, `chore/**`, `hotfix/**`, `bugfix/**`, `refactor/**`, `test/**`, `docs/**`
- **Jobs**: Test → Build → Deploy to fixed preview environment
- **Concurrency**: Cancels in-progress preview deploys (all branches share one preview environment)

## Setup Instructions

### 1. GitHub Secrets

Add these secrets in GitHub Settings → Secrets and Variables → Actions:

```
RENDER_DEPLOY_HOOK_PRODUCTION  # Render deploy hook URL for production
RENDER_DEPLOY_HOOK_STAGING     # Render deploy hook URL for staging
RENDER_DEPLOY_HOOK_PREVIEW     # Render deploy hook URL for preview
RENDER_API_KEY                 # (Optional) Render API key for advanced features
RENDER_SERVICE_ID              # (Optional) Render service ID
```

### 2. GitHub Variables

Add these variables in GitHub Settings → Secrets and Variables → Actions:

```
PRODUCTION_URL    # e.g., https://deep-research-agent.onrender.com
STAGING_URL       # e.g., https://deep-research-agent-staging.onrender.com
PREVIEW_URL       # e.g., https://deep-research-agent-preview.onrender.com
```

### 3. GitHub Environments

Create these environments in GitHub Settings → Environments:

- `production` - Add required reviewers if needed
- `staging`
- `preview`

### 4. Render Setup

1. **Create Services**: Import the `render.yaml` in Render Dashboard
   - This creates production, staging, and preview services with their databases
2. **Get Deploy Hooks**:
   - Go to each service (production, staging, preview) → Settings → Deploy Hook
   - Copy the URL and add to GitHub Secrets as:
     - `RENDER_DEPLOY_HOOK_PRODUCTION`
     - `RENDER_DEPLOY_HOOK_STAGING`
     - `RENDER_DEPLOY_HOOK_PREVIEW`

### 5. Create Staging Branch

```bash
git checkout main
git checkout -b staging
git push -u origin staging
```

## Deployment Flow

### Feature Development
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and push
git push -u origin feature/my-feature
# → Automatically deploys to preview environment

# After testing in preview, create PR and merge to staging
# → Staging deployment triggered
```

### Staging to Production
```bash
# After testing in staging
git checkout main
git merge staging
git push origin main
# → Production deployment triggered
```

## Environment Variables

All services require these environment variables (configured in Render):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM |
| `TAVILY_API_KEY` | Tavily API key for search |
| `E2B_API_KEY` | E2B API key for code execution |
| `LANGFUSE_PUBLIC_KEY` | LangFuse public key |
| `LANGFUSE_SECRET_KEY` | LangFuse secret key |
| `LANGFUSE_HOST` | LangFuse host URL |
| `JWT_SECRET` | JWT signing secret |
| `ALLOWED_ORIGINS` | CORS allowed origins |
| `ENVIRONMENT` | `production`, `staging`, or `preview` |

## Monitoring

- **LangFuse**: Trace monitoring at https://us.cloud.langfuse.com
- **Render Logs**: Available in Render Dashboard
- **Health Checks**: `/health` endpoint on all services

## Rollback

### Via Render Dashboard
1. Go to service → Deploys
2. Find the previous successful deploy
3. Click "Rollback to this deploy"

### Via Git
```bash
git revert HEAD
git push origin main  # or staging
```
