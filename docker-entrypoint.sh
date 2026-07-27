#!/bin/bash
set -e

echo "Starting Crisis Monitoring Backend..."

# Run database migrations (or create tables if alembic not fully configured)
echo "Running database initialization & migrations..."
python -c "from backend.core.database import init_db; init_db()"

# Seed the historical data if needed
echo "Seeding historical data..."
python scripts/seed_db.py

# Execute the main container command (uvicorn)
echo "Starting web server..."
exec "$@"
