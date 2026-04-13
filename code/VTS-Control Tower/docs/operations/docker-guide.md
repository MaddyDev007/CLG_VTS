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

`POSTGRES_IMAGE_TAG` defaults to `15-alpine`. Keep that value when reusing an existing Docker volume created by PostgreSQL 15. If you intentionally move to PostgreSQL 16 or newer, migrate the data first or recreate the volume.

### Required root `.env` values

- `POSTGRES_DB`
- `POSTGRES_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

### Optional root `.env` values

- `POSTGRES_IMAGE_TAG`
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

## Local Docker Quick Start

Use this path when you are running the full stack on your own machine with Docker.

Important:

- run all `docker compose ...` commands from the repository root
- the frontend UI is the only normal browser entrypoint
- the backend is reached through the frontend nginx proxy, not by opening port `3000` in the browser

Start from the repo root:

```bash
cd /home/maheshkumar/projects/CLG_VTS
```

On first setup only:

```bash
cp .env.example .env
```

Start the local Docker stack:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose up -d --build
```

What to open in your browser on local Docker:

- frontend UI: `http://localhost`
- backend health through nginx: `http://localhost/api/health`
- Swagger UI through nginx: `http://localhost/api/docs`
- frontend container health: `http://localhost/health`

Quick answer:

- open `http://localhost`

## Local Simulator

Start the simulator only when you need it:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose --profile simulator up -d --build vts-device-simulator
```

What to open locally:

- simulator UI: `http://127.0.0.1:3011`
- simulator health: `http://127.0.0.1:3011/health`

The simulator now binds to `0.0.0.0:3011` by default.

- on the same machine, use `http://localhost:3011` or `http://127.0.0.1:3011`
- on EC2, use `http://<ec2-public-host-or-dns>:3011` after allowing inbound TCP `3011`

## Local Debug Checklist

When Docker is up but something looks broken, check in this order.

### 1. Confirm container status

```bash
docker compose ps
docker compose --profile simulator ps
```

You want to see:

- `frontend` healthy
- `backend` healthy
- `postgres` healthy
- `mosquitto` healthy
- `vts-device-simulator` healthy when the simulator profile is enabled

### 2. Check the URLs directly

```bash
curl http://localhost/health
curl http://localhost/api/health
curl http://127.0.0.1:3011/health
```

Use the simulator health URL only if the simulator profile is running.

### 3. Follow logs for the failing service

```bash
docker compose logs -f postgres
docker compose logs -f mosquitto
docker compose logs -f backend
docker compose logs -f frontend
docker compose --profile simulator logs -f vts-device-simulator
```

### 4. Check the most common root causes

- frontend UI does not open:
  `frontend` container is not healthy
- frontend opens but API calls fail:
  backend is unhealthy, so check `docker compose logs -f backend`
- backend is unhealthy because Postgres is failing:
  check `docker compose logs -f postgres`
- backend is healthy but live telemetry does not move:
  check `docker compose logs -f mosquitto backend`
- simulator UI opens but publish does not work:
  check `docker compose --profile simulator logs -f vts-device-simulator`

### 5. Quick service-level checks

Database:

```bash
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

MQTT from inside the backend container:

```bash
docker compose exec backend node -e "require('mqtt').connect('mqtt://mosquitto:1883').on('connect', client => { console.log('mqtt-ok'); client.end(); })"
```

## EC2 Deployment Commands

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

- frontend UI: `http://<ec2-public-host-or-dns>`
- backend API via nginx: `http://<ec2-public-host-or-dns>/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>/api/docs`

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

- frontend UI: `http://<ec2-public-host-or-dns>`
- backend API via nginx: `http://<ec2-public-host-or-dns>/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>/api/docs`

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

- frontend UI: `http://<ec2-public-host-or-dns>`
- backend API via nginx: `http://<ec2-public-host-or-dns>/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>/api/docs`

If you also need the simulator:

```bash
docker compose --profile simulator build vts-device-simulator
docker compose --profile simulator up -d vts-device-simulator
```

Expected simulator URLs after startup:

- simulator UI/API: `http://127.0.0.1:3011`
- simulator health: `http://127.0.0.1:3011/health`

From another machine, the same simulator is reachable at:

- `http://<ec2-public-host-or-dns>:3011`
- `http://<ec2-public-host-or-dns>:3011/health`

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

Frontend UI does not open locally:

- open `http://localhost`
- if that fails, run `docker compose ps`
- then run `docker compose logs -f frontend`

Frontend opens but data is missing:

- check `http://localhost/api/health`
- if `/api/health` fails, run `docker compose logs -f backend`
- if backend logs mention database startup, run `docker compose logs -f postgres`

Simulator UI opens but publish fails:

- check `http://127.0.0.1:3011/health`
- run `docker compose --profile simulator logs -f vts-device-simulator`
- confirm the health JSON shows `transports.mqtt.connected: true`

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

- frontend UI: `http://<ec2-public-host-or-dns>`
- backend API via nginx: `http://<ec2-public-host-or-dns>/api`
- Swagger UI via nginx: `http://<ec2-public-host-or-dns>/api/docs`

Return to the main branch when you are ready:

```bash
git checkout <branch-name>
```
