#!/bin/bash

echo "Restarting Temporal services..."
docker compose restart temporal temporal-web
