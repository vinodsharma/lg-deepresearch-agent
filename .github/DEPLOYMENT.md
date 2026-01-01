# Deployment Guide

This project uses GitHub Actions for CI/CD with Render as the hosting platform.

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | `main` | `https://deep-research-agent.onrender.com` | Live production environment |
| Staging | `staging` | `https://deep-research-agent-staging.onrender.com` | Pre-production testing |
| Preview | `feature/*`, `fix/*`, `chore/*` | Auto-generated | PR preview environments |

## Workflow Overview

```
feature/* ─┬─► PR ──► Preview Environment
fix/*      │         (auto-created by Render)
chore/*   ─┘
              │
              ▼
           staging ──► Staging Environment
              │
              ▼
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
- **Triggers**: PRs to `main` or `staging`
- **Jobs**: Test → Build → Preview Deploy
- **Concurrency**: Cancels in-progress preview deploys per branch

## Setup Instructions

### 1. GitHub Secrets

Add these secrets in GitHub Settings → Secrets and Variables → Actions:

```
RENDER_DEPLOY_HOOK_PRODUCTION  # Render deploy hook URL for production
RENDER_DEPLOY_HOOK_STAGING     # Render deploy hook URL for staging
RENDER_API_KEY                 # (Optional) Render API key for advanced features
RENDER_SERVICE_ID              # (Optional) Render service ID
```

### 2. GitHub Variables

Add these variables in GitHub Settings → Secrets and Variables → Actions:

```
PRODUCTION_URL    # e.g., https://deep-research-agent.onrender.com
STAGING_URL       # e.g., https://deep-research-agent-staging.onrender.com
```

### 3. GitHub Environments

Create these environments in GitHub Settings → Environments:

- `production` - Add required reviewers if needed
- `staging`
- `preview`

### 4. Render Setup

1. **Create Services**: Import the `render.yaml` in Render Dashboard
2. **Get Deploy Hooks**:
   - Go to each service → Settings → Deploy Hook
   - Copy the URL and add to GitHub Secrets
3. **Enable PR Previews**:
   - Go to staging service → Settings → PR Previews → Enable

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

# Open PR → Preview environment created automatically
# After review → Merge to staging
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
