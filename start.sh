#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Frontend only (nginx). Open http://localhost:${FRONTEND_PORT:-5173}"
echo "API is expected at VITE_API_URL (default http://localhost:3000) — start notareon-server separately."
exec docker compose up --build "$@"
