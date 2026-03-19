# Services

| Service | Port | Description |
| --- | --- | --- |
| Backend API (local) | 3000 | NestJS REST API + WebSocket |
| Swagger (local) | 3000/api/docs | API documentation |
| PostgreSQL (Docker) | 5432 | Database |
| MQTT Broker (optional) | 1883 | Telemetry ingestion |
| Temporal Server (optional) | 7233 | Workflow engine |
| Temporal Web UI (optional) | 8233 | Workflow dashboard |

## Access URLs
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
