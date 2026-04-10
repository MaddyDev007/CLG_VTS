#!/bin/bash

echo "Resetting infrastructure..."

docker compose down --remove-orphans
docker system prune -f
docker compose up -d
