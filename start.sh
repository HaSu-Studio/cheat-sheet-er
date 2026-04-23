#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  if [[ ! -f .env.example ]]; then
    echo "Нет .env и .env.example — нечего копировать." >&2
    exit 1
  fi
  cp .env.example .env
  echo "Создан .env из .env.example — проверь VITE_API_URL и порты."
fi

echo "Frontend: порт FRONTEND_PORT в .env. API: VITE_API_URL в .env."
exec docker compose --env-file .env up --build "$@"
