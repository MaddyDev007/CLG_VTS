# Deployment Guide

## Requirements
- Node.js 20+
- PostgreSQL 15+
- MQTT broker (Mosquitto) if ingesting MQTT telemetry
- Temporal server only if `TEMPORAL_ENABLED=true`

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
- API_PREFIX
- TEMPORAL_ENABLED and TEMPORAL_ADDRESS only if Temporal is enabled
- TELEMETRY_STATE_STORE and REDIS_URL only if you want Redis-backed state

## Run
```bash
node dist/main.js
```

## Docker note
The repo-level `docker-compose.yml` is now the supported single-host deployment path for EC2. It brings up:
- PostgreSQL
- Mosquitto
- backend
- frontend
- optional simulator profile

## Observability
Use process manager logs or container logs to verify:
- DB connectivity
- MQTT subscription
- WebSocket event emission
- Temporal connection (if enabled)
