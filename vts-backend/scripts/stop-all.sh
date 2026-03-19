#!/bin/bash

echo "Stopping infrastructure..."

docker compose down --remove-orphans
