#!/bin/bash

set -e

echo "Starting infrastructure services..."

docker compose up -d postgres redis mosquitto temporal temporal-ui

echo "Waiting for PostgreSQL to be ready..."

until docker exec vts-postgres pg_isready -U postgres > /dev/null 2>&1
do
  sleep 2
done

echo "PostgreSQL is ready."

echo "Waiting for Temporal server..."

until nc -z localhost 7233
do
  sleep 2
done

echo "Temporal server is ready."

echo "Running containers:"
docker ps

echo "Infrastructure started successfully."
