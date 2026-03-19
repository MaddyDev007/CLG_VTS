# Services and Ports

| Service | Technology | Default Port | Purpose |
| --- | --- | --- | --- |
| Backend API (local) | NestJS | 3000 | REST + WebSocket |
| Swagger UI (local) | @nestjs/swagger | 3000/api/docs | API docs |
| PostgreSQL (Docker) | Postgres | 5432 | Persistent storage |
| MQTT Broker (optional) | Mosquitto | 1883 | Device telemetry ingestion |
| Temporal Server (optional) | Temporal | 7233 | Workflow engine |
| Temporal Web UI (optional) | Temporal Web | 8233 | Workflow dashboard |

## Endpoints
- REST Base: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- WebSocket: `ws://localhost:3000/telemetry`

## MQTT Topics
- Publish telemetry: `vts/<deviceId>/telemetry`

## Database (local dev)
- Host: `localhost`
- Port: `5432`
- DB: `vts`
- User: `postgres`
- Password: `vts123`

## Notes
- Docker Compose in this repo provisions **PostgreSQL only**.
- MQTT broker and Temporal services run separately if needed.
