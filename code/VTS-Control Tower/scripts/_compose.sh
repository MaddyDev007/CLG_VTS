#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "${SCRIPT_DIR}/../../.." && pwd)
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not available in PATH." >&2
  exit 1
fi

compose() {
  docker compose --project-directory "${REPO_ROOT}" -f "${COMPOSE_FILE}" "$@"
}

run_compose() {
  compose "$@"
}
