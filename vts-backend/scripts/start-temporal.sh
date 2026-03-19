#!/bin/bash

set -e

echo "Starting Temporal..."

docker compose up -d temporal
docker compose up -d temporal-web

echo "Temporal started."
echo "Temporal UI: http://localhost:8233"
