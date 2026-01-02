#!/bin/bash
set -e

echo "Running database migrations..."
uv run prisma migrate deploy

echo "Starting application..."
exec uv run uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
