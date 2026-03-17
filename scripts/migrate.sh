#!/bin/bash
# Database migration script for Render deployment
# Run this script after deployment to apply database migrations

set -e

echo "[Migration] Starting database migration..."

cd "$(dirname "$0")/.."

# Run drizzle-kit migrate
pnpm exec drizzle-kit migrate

if [ $? -eq 0 ]; then
    echo "[Migration] ✓ Database migration completed successfully"
    exit 0
else
    echo "[Migration] ✗ Database migration failed"
    exit 1
fi
