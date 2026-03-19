# Infrastructure

| Service | Port |
| --- | --- |
| Backend API (local) | 3000 |
| Swagger (local) | 3000/api/docs |
| PostgreSQL (Docker) | 5432 |
| MQTT Broker (optional) | 1883 |
| Temporal Server (optional) | 7233 |
| Temporal Web UI (optional) | 8233 |

Notes:
- Docker Compose in this repo provisions only PostgreSQL.
- MQTT and Temporal run separately if required.
