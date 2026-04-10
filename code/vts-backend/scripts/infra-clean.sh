#!/bin/bash

echo "Cleaning orphan containers..."

docker rm -f vts-postgres 2>/dev/null
docker rm -f vts-temporal 2>/dev/null
docker rm -f vts-temporal-web 2>/dev/null
docker rm -f vts-mosquitto 2>/dev/null

docker network prune -f
