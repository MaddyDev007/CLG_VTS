# Local Testing Guide

## Purpose

Use this flow when you want fast feedback with local `npm` processes before rebuilding containers.

## Infra First

From the repository root:

```bash
cd /home/maheshkumar/projects/CLG_VTS
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
cd /home/maheshkumar/projects/CLG_VTS
COMPOSE_PARALLEL_LIMIT=1 docker compose build backend frontend
docker compose up -d
```
