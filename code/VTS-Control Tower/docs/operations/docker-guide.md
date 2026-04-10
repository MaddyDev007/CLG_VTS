# Docker Guide

## What Was Dockerized

The following projects are now Dockerized:

- `code/vts-backend`
- `code/vts-frontend`
- `code/vts-device-simulator`

The following project is intentionally excluded:

- `code/Firmware`

## Where Docker Compose Lives

The main Compose file was moved out of the backend and placed at the repository root:

- `docker-compose.yml`

This location is better because it manages the full platform, not just the backend.

## Containers In The Stack

Application containers:

- `vts-backend`
- `vts-frontend`
- `vts-device-simulator`

Infrastructure containers:

- `vts-postgres`
- `vts-mosquitto`
- `vts-redis`
- `vts-temporal`
- `vts-temporal-ui`

## Container Responsibilities

### `vts-backend`

- Runs the NestJS API
- Listens for MQTT telemetry
- Exposes TCP and UDP ingestion ports
- Connects to PostgreSQL, Redis, Mosquitto, and Temporal

Ports:

- `3000` HTTP API
- `4001/udp` UDP telemetry ingestion
- `4002/tcp` TCP telemetry ingestion

### `vts-frontend`

- Builds the React app
- Serves the production frontend via Nginx

Port:

- `5173`

### `vts-device-simulator`

- Builds the simulator React UI
- Runs the simulator Express server
- Serves the built simulator UI and its `/health`, `/devices`, and `/publish` endpoints from one container
- Publishes directly to MQTT, TCP, or UDP targets

Port:

- `3011`

### `vts-postgres`

- Stores application data

Port:

- `5432`

### `vts-mosquitto`

- MQTT broker for telemetry
- WebSocket MQTT endpoint

Ports:

- `1883`
- `9001`

### `vts-redis`

- Redis cache/state store

Port:

- `6379`

### `vts-temporal`

- Temporal workflow service

Port:

- `7233`

### `vts-temporal-ui`

- Temporal web UI

Port:

- `8080`

## Files Added Or Changed

### New root orchestration

- `docker-compose.yml`
- `docker/mosquitto/mosquitto.conf`

### Backend updates

- `code/vts-backend/src/main.ts`
- `code/vts-backend/src/config/env.validation.ts`
- `code/vts-backend/.env.docker`
- `code/vts-backend/README.md`

### Frontend Docker support

- `code/vts-frontend/Dockerfile`
- `code/vts-frontend/nginx.conf`
- `code/vts-frontend/.dockerignore`

### Simulator Docker support

- `code/vts-device-simulator/Dockerfile`
- `code/vts-device-simulator/.dockerignore`
- `code/vts-device-simulator/server/index.ts`
- `code/vts-device-simulator/package.json`
- `code/vts-device-simulator/vite.config.ts`

## URLs After `docker compose up`

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Simulator: `http://localhost:3011`
- Temporal UI: `http://localhost:8080`
- MQTT broker: `mqtt://localhost:1883`

## Build Commands

Build everything:

```bash
docker compose build
```

Build one container:

```bash
docker compose build backend
docker compose build frontend
docker compose build vts-device-simulator
```

Build from scratch without cache:

```bash
docker compose build --no-cache
```

## Start Commands

Recommended order after successful local testing:

1. stop the local backend terminal
2. stop the local frontend terminal
3. stop the simulator server terminal
4. stop the simulator UI terminal
5. start Docker from the repository root

Important rule:

- do not run local `npm` app processes and Docker app containers at the same time
- otherwise you can hit port conflicts on `3000`, `3011`, `5173`, `4001`, and `4002`

Start the full stack in detached mode:

```bash
docker compose up -d
```

Start and rebuild changed images:

```bash
docker compose up -d --build
```

Clean handoff from local testing to Docker:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose stop backend frontend vts-device-simulator
docker compose up -d --build
```

Completely clean restart:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose down
docker compose up -d --build
```

Start only selected services:

```bash
docker compose up -d postgres mosquitto redis temporal temporal-ui
docker compose up -d backend
docker compose up -d frontend vts-device-simulator
```

Run in foreground:

```bash
docker compose up
```

## Stop Commands

Stop all running containers without removing them:

```bash
docker compose stop
```

Stop one service:

```bash
docker compose stop backend
docker compose stop frontend
docker compose stop vts-device-simulator
```

Restart a service:

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart vts-device-simulator
```

## Remove Containers

Stop and remove the project containers and network:

```bash
docker compose down
```

Stop and remove project containers, network, and volumes:

```bash
docker compose down -v
```

Remove project containers and also remove orphan containers:

```bash
docker compose down --remove-orphans
```

## Delete Unused Docker Resources

Delete stopped containers:

```bash
docker container prune -f
```

Delete unused images:

```bash
docker image prune -f
```

Delete unused volumes:

```bash
docker volume prune -f
```

Delete unused networks:

```bash
docker network prune -f
```

Delete everything unused:

```bash
docker system prune -f
```

Delete everything unused including volumes:

```bash
docker system prune -a --volumes -f
```

## Logs And Status

See running services:

```bash
docker compose ps
```

See logs for all services:

```bash
docker compose logs -f
```

See logs for one service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f vts-device-simulator
```

## Shell Access

Open a shell in a running container:

```bash
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec vts-device-simulator sh
```

## Notes About Networking

- The browser reaches the backend through `localhost:3000`
- The browser reaches the frontend through `localhost:5173`
- The browser reaches the simulator through `localhost:3011`
- Containers reach each other through Compose service names such as `postgres`, `mosquitto`, and `backend`

Simulator transport behavior:

- local `npm` testing uses `localhost` or `127.0.0.1`
- Docker `vts-device-simulator` uses Compose service names internally
- the simulator still loads assigned devices from Postgres and publishes the same telemetry contract
- the MQTT topic stays `vts/devices/<device_id>/telemetry` in both local and Docker flows

## Local Testing Before Docker

Recommended pattern:

1. run infra first with `docker compose up -d postgres mosquitto redis temporal temporal-ui`
2. test backend locally with `npm run start:dev`
3. test frontend locally with `npm run dev`
4. test simulator locally with `npm run server` and `npm run dev`
5. once local validation passes, stop those local app terminals
6. then run `docker compose up -d --build`

If local testing worked, Docker should follow the same application flow. The main difference is only the network addresses:

- local app processes use `localhost`
- Docker containers use service names
- AWS Docker deployment follows the same Compose networking model from inside the containers

## Changing The Host Used In Built Frontend URLs

The Compose file supports `PUBLIC_HOST`.

Example:

```bash
PUBLIC_HOST=192.168.31.41 docker compose up -d --build
```

This updates the built frontend and simulator browser URLs to use that host instead of `localhost`.
