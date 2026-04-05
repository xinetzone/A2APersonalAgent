#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/a2a}
BRANCH=${BRANCH:-main}
ENV_FILE=${ENV_FILE:-.env.production}

cd "$APP_DIR"

git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only

SHA=$(git rev-parse --short HEAD)
export IMAGE_TAG="$SHA"

docker compose --env-file "$ENV_FILE" -f docker-compose.yml pull || true
docker compose --env-file "$ENV_FILE" -f docker-compose.yml build
docker compose --env-file "$ENV_FILE" -f docker-compose.yml up -d

echo "$IMAGE_TAG" > deploy/.last_successful

docker compose --env-file "$ENV_FILE" -f docker-compose.yml ps
