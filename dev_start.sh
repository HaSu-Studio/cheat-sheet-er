#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  if [[ ! -f .env.example ]]; then
    echo "Нет .env и .env.example" >&2
    exit 1
  fi
  cp .env.example .env
  echo "Создан .env из .env.example"
fi

[[ -d node_modules ]] || npm install

echo "Vite dev (hot reload). API должен быть запущен (notareon-server ./dev_start.sh или корень ./dev_start.sh)."
exec npm run dev
