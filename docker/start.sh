#!/bin/bash
set -euo pipefail

echo "Starting InsightOps..."

cd /app/backend

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ]; then
  echo "Running database migrations..."
  migration_ok=0
  for attempt in $(seq 1 30); do
    if alembic upgrade head; then
      migration_ok=1
      echo "Database migrations completed."
      break
    fi
    echo "Migration attempt ${attempt}/30 failed; retrying in 2s..."
    sleep 2
  done

  if [ "$migration_ok" -ne 1 ]; then
    echo "Failed to run migrations after 30 attempts."
    exit 1
  fi
fi

# Nginx serves the frontend and reverse-proxies /api to Uvicorn.
nginx -g 'daemon off;' &
NGINX_PID=$!

# DuckDB is embedded and file-locked; keep a single worker process.
python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers "${UVICORN_WORKERS:-1}" \
  --log-level "${UVICORN_LOG_LEVEL:-info}"

kill "$NGINX_PID" 2>/dev/null || true
