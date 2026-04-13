# Docker Guide

## Deployment Shape

This repo now supports a production-like single-host deployment on one Ubuntu EC2 instance using Docker and Docker Compose only.

Default services:

- `postgres`
- `mosquitto`
- `backend`
- `frontend`

Optional profile:

- `vts-device-simulator`

Default EC2 behavior:

- only the frontend container publishes a public HTTP port
- backend, PostgreSQL, Mosquitto, and simulator stay on the Docker network unless you explicitly expose them
- Temporal is disabled by default and is not started by Compose
- Redis is optional; the backend falls back to in-memory telemetry state when `REDIS_URL` is unset

## Source-Of-Truth Paths

Use only these repo paths for EC2 deployment:

- `code/vts-backend`
- `code/vts-frontend`
- `code/vts-device-simulator`
- `docker/mosquitto/mosquitto.conf`

Do not rely on any manually copied top-level `frontend/` or `simulator/` folders on the server.

## Ubuntu EC2 Prerequisites

- Ubuntu 24.04
- Docker Engine installed
- Docker Compose plugin installed
- enough free disk on the 20 GiB root volume for image builds
- inbound HTTP allowed to the frontend port in the EC2 security group

Recommended checks:

```bash
docker version
docker compose version
```

## Env Files

Compose reads:

- root deployment env: `.env`
- backend Compose defaults: `docker/env/backend.env`
- simulator Compose defaults: `docker/env/simulator.env`

Templates:

- root deployment template: `.env.example`
- backend local template: `code/vts-backend/.env.example`
- frontend local template: `code/vts-frontend/.env.example`
- simulator local template: `code/vts-device-simulator/.env.example`

Create the deployment env file once on the EC2 host:

```bash
cp .env.example .env
```

### Required root `.env` values

- `POSTGRES_DB`
- `POSTGRES_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

### Optional root `.env` values

- `FRONTEND_BIND_ADDRESS`
- `FRONTEND_PORT`
- `SIMULATOR_BIND_ADDRESS`
- `SIMULATOR_PORT`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_DEVICE_SIMULATOR_URL`
- `VITE_MQTT_TOPIC_PREFIX`
- `FRONTEND_NODE_OPTIONS`
- `SIMULATOR_NODE_OPTIONS`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `CORS_ORIGINS`
- `TEMPORAL_ENABLED`
- `TEMPORAL_ADDRESS`
- `REDIS_URL`

### Local-dev-only values

These stay in app-local env files and are not needed for the EC2 Compose path:

- `code/vts-backend/.env`
- `code/vts-frontend/.env`
- `code/vts-device-simulator/.env`

## Routing Model

The frontend container is the public entrypoint.

- nginx serves the built React app
- `/api/*` proxies to `backend:3000`
- `/socket.io/*` proxies to `backend:3000`
- SPA refreshes fall back to `index.html`

This keeps the backend internal while preserving REST and WebSocket behavior for the browser.

## Exact Deployment Commands

Pull the latest code:

```bash
git pull
```

Build the default stack:

```bash
docker compose build
```

Start the default stack:

```bash
docker compose up -d
```

Expected URLs after startup:

- frontend UI: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}`
- backend API via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api/docs`

Read logs:

```bash
docker compose logs
docker compose logs -f backend
docker compose logs -f frontend
```

Stop and remove containers:

```bash
docker compose down
```

Rebuild after code changes:

```bash
git pull
docker compose build
docker compose up -d
```

Expected URLs after startup:

- frontend UI: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}`
- backend API via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api/docs`

## Optional Simulator

Build and start the simulator only when needed:

```bash
docker compose --profile simulator build vts-device-simulator
docker compose --profile simulator up -d vts-device-simulator
```

Expected simulator URLs after startup:

- simulator UI/API: `http://127.0.0.1:${SIMULATOR_PORT:-3011}`
- simulator health: `http://127.0.0.1:${SIMULATOR_PORT:-3011}/health`

By default the simulator binds to `127.0.0.1:${SIMULATOR_PORT:-3011}`, so it is not publicly exposed.

## Verification

Frontend:

- open `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}`

Backend health through nginx:

```bash
curl http://127.0.0.1:${FRONTEND_PORT:-80}/api/health
```

Frontend container health:

```bash
curl http://127.0.0.1:${FRONTEND_PORT:-80}/health
```

Database connectivity:

```bash
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

MQTT connectivity:

```bash
docker compose exec backend node -e "require('mqtt').connect('mqtt://mosquitto:1883').on('connect', client => { console.log('mqtt-ok'); client.end(); })"
```

WebSocket updates:

- open the dashboard in a browser
- start the simulator profile
- publish telemetry from the simulator
- confirm live updates arrive without a page refresh

## Low-Memory Guidance For `t3.micro`

Repo-level hardening included in this deployment path:

- `npm ci` in all Docker builds
- app-level `.dockerignore` files
- multi-stage frontend and simulator images
- static nginx frontend runtime
- Temporal disabled by default
- optional simulator profile
- Redis removed from the default stack

Preferred low-load build order:

```bash
docker compose build backend
docker compose build frontend
docker compose up -d
```

Expected URLs after startup:

- frontend UI: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}`
- backend API via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api/docs`

If you also need the simulator:

```bash
docker compose --profile simulator build vts-device-simulator
docker compose --profile simulator up -d vts-device-simulator
```

Expected simulator URLs after startup:

- simulator UI/API: `http://127.0.0.1:${SIMULATOR_PORT:-3011}`
- simulator health: `http://127.0.0.1:${SIMULATOR_PORT:-3011}/health`

If builds still OOM, add swap before rebuilding:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h
```

## Security And Exposure

Default public exposure:

- frontend HTTP only

Default internal-only services:

- PostgreSQL
- Mosquitto
- backend HTTP
- backend TCP/UDP ingestion ports
- simulator

Only publish backend, MQTT, or simulator ports if something outside Docker truly needs them. If you do expose them, keep the AWS security group restricted to the minimum source IPs and ports.

## Troubleshooting

Backend never becomes healthy:

- run `docker compose logs -f backend`
- confirm `.env` values for `DB_PASSWORD` and `JWT_SECRET`
- confirm PostgreSQL is healthy
- confirm Mosquitto is healthy

Frontend loads but API calls fail:

- run `docker compose logs -f frontend backend`
- confirm `VITE_API_BASE_URL=/api`
- confirm `/api/health` returns `200`

Simulator does not publish:

- start it with the `simulator` profile
- run `docker compose --profile simulator logs -f vts-device-simulator`
- confirm the simulator health endpoint shows `mqtt.connected: true`

Builds fail on low memory:

- build one image at a time
- enable swap
- run `docker system df`

## Rollback

Roll back to a previous git revision:

```bash
git log --oneline -n 5
git checkout <previous-commit>
docker compose build
docker compose up -d
```

Expected URLs after startup:

- frontend UI: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}`
- backend API via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>:${FRONTEND_PORT:-80}/api/docs`

Return to the main branch when you are ready:

```bash
git checkout <branch-name>
```
