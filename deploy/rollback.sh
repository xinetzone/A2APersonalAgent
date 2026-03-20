#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/a2a}
ENV_FILE=${ENV_FILE:-.env.production}
TARGET_TAG=${1:-}

cd "$APP_DIR"

if [[ -z "$TARGET_TAG" ]]; then
  if [[ -f deploy/.last_successful ]]; then
    TARGET_TAG=$(cat deploy/.last_successful)
  else
    echo "Missing rollback tag and deploy/.last_successful not found" >&2
    exit 1
  fi
fi

export IMAGE_TAG="$TARGET_TAG"

docker compose --env-file "$ENV_FILE" -f docker-compose.yml up -d
docker compose --env-file "$ENV_FILE" -f docker-compose.yml ps
