# Local Testing Guide

## Purpose

Use this flow when you want fast feedback with local `npm` processes before rebuilding containers.

## Docker Helper Scripts

Control Tower now includes shared Docker helper scripts in `code/VTS-Control Tower/scripts`.

From the repository root:

```bash
cd "code/VTS-Control Tower/scripts"
```

Main shortcuts:
- `./build-all.sh`: build all compose services, including `vts-device-simulator`
- `./start-all.sh`: start `postgres`, `mosquitto`, `backend`, `frontend`, and `vts-device-simulator`
- `./stop-all.sh`: stop `postgres`, `mosquitto`, `backend`, `frontend`, and `vts-device-simulator`

Device simulator shortcut:
- `./build-device-simulator.sh`
- `./start-device-simulator.sh`
- `./stop-device-simulator.sh`

`vts-device-simulator` is a single Docker service that serves both the simulator API/server and the simulator UI from the same container.

Individual service shortcuts:
- `./build-postgres.sh` / `./start-postgres.sh` / `./stop-postgres.sh`
- `./build-mosquitto.sh` / `./start-mosquitto.sh` / `./stop-mosquitto.sh`
- `./build-backend.sh` / `./start-backend.sh` / `./stop-backend.sh`
- `./build-frontend.sh` / `./start-frontend.sh` / `./stop-frontend.sh`

Single-service `start-*.sh` scripts use `--no-deps`, so they only start the named container.

## Infra First

From the repository root:

```bash
cd <repo-root>
docker compose up -d postgres mosquitto
```

Optional extras:
- Temporal is off by default and not required for normal local testing.
- Redis is not required unless you explicitly switch the backend telemetry state store to Redis.

Do not run local app processes and Docker app containers on the same ports at the same time.

## Backend

```bash
cd code/vts-backend
npm ci
npm run start:dev
```

Expected URLs:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

## Frontend

```bash
cd code/vts-frontend
npm ci
npm run dev
```

Expected URL:
- `http://localhost:5173`

## Simulator

```bash
cd code/vts-device-simulator
npm ci
npm run server
```

In a second terminal:

```bash
cd code/vts-device-simulator
npm run dev
```

Expected URLs:
- simulator API: `http://localhost:3011`
- simulator UI: Vite will print the URL it selected

## Switch Back To Docker

Stop local app processes first, then rebuild containers:

```bash
cd <repo-root>
COMPOSE_PARALLEL_LIMIT=1 docker compose build backend frontend
docker compose up -d
```
