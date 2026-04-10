#!/bin/bash

set -e

echo "Stopping Temporal..."

docker compose stop temporal-web
docker compose stop temporal
