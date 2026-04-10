# Deployment Guide

## Requirements
- Node.js 20+
- PostgreSQL 15+
- MQTT broker (Mosquitto) if ingesting MQTT telemetry
- Temporal server if Temporal module is enabled

## Build
```bash
npm install
npm run build
```

## Environment
Set production variables:
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET, JWT_EXPIRES_IN
- MQTT_BROKER_URL, MQTT_TELEMETRY_TOPIC
- TEMPORAL_ADDRESS (if Temporal is enabled)

## Run
```bash
node dist/main.js
```

## Docker note
The `docker-compose.yml` in this repo only provisions PostgreSQL for local development. For production, deploy Postgres and the backend separately (or add a backend service to compose).

## Observability
Use process manager logs or container logs to verify:
- DB connectivity
- MQTT subscription
- WebSocket event emission
- Temporal connection (if enabled)
