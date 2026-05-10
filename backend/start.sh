#!/bin/sh
set -e

attempt=1
until python run_migrations.py upgrade head; do
  if [ "$attempt" -ge 10 ]; then
    echo "Alembic migration failed after ${attempt} attempts."
    exit 1
  fi
  echo "Waiting for database before retrying migrations..."
  attempt=$((attempt + 1))
  sleep 2
done

exec uvicorn app.main:app --host "${APP_HOST:-0.0.0.0}" --port "${PORT:-${APP_PORT:-8000}}"
