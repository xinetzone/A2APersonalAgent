#!/usr/bin/env bash
set -euo pipefail

HOST=${HOST:-127.0.0.1}
PORT=${PORT:-3000}

curl -fsS "http://${HOST}:${PORT}/healthz" >/dev/null
echo "healthz ok: http://${HOST}:${PORT}/healthz"
