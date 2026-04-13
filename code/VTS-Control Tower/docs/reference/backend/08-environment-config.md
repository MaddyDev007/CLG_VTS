# Environment Configuration

All variables are read from `.env` (local) or process environment.

## Core
| Variable | Description |
| --- | --- |
| NODE_ENV | Environment name (development/production) |
| PORT | HTTP server port (default 3000) |
| API_PREFIX | Optional route prefix. Docker deployment uses `api`. |

## Database
| Variable | Description |
| --- | --- |
| DB_HOST | Postgres host |
| DB_PORT | Postgres port |
| DB_NAME | Database name |
| DB_USER | Database user |
| DB_PASSWORD | Database password |

## JWT
| Variable | Description |
| --- | --- |
| JWT_SECRET | JWT signing secret |
| JWT_EXPIRES_IN | Token expiry (e.g. 1d) |

## MQTT
| Variable | Description |
| --- | --- |
| MQTT_BROKER_URL | Broker URL (e.g. mqtt://localhost:1883) |
| MQTT_USERNAME | Broker username (optional) |
| MQTT_PASSWORD | Broker password (optional) |
| MQTT_TELEMETRY_TOPIC | Topic pattern (default: vts/+/telemetry) |

## WebSocket
| Variable | Description |
| --- | --- |
| WS_NAMESPACE | Socket.IO namespace (default: /telemetry) |

## Temporal (optional)
| Variable | Description |
| --- | --- |
| TEMPORAL_ENABLED | Set to `true` only when a Temporal server is available |
| TEMPORAL_ADDRESS | Temporal frontend address when Temporal is enabled |

## Telemetry state storage (optional)
| Variable | Description |
| --- | --- |
| TELEMETRY_STATE_STORE | `memory` or `redis` |
| REDIS_URL | Redis connection string when `TELEMETRY_STATE_STORE=redis` |
| REDIS_STATE_TTL_SECONDS | TTL for telemetry runtime state |
