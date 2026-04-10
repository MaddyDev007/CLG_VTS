# Local Testing Guide

## Purpose

Use this guide when you want to test the platform locally before building Docker images.

This is the recommended order:

1. start required infrastructure
2. run backend locally
3. run frontend locally
4. run `vts-device-simulator` locally
5. verify the full flow
6. only then build and run Docker

## Current Local Workflow

### 1. Start Infrastructure

If your local apps need shared services, start infrastructure first.

Important rule:

- for local `npm` testing, run only infrastructure containers in Docker
- do not run Docker `backend`, `frontend`, or `vts-device-simulator` containers at the same time as local app processes
- otherwise you can hit port conflicts on `3000`, `4001`, `4002`, or `3011`

From the repository root:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose up -d postgres mosquitto redis temporal temporal-ui
```

This starts:

- PostgreSQL
- Mosquitto
- Redis
- Temporal
- Temporal UI

If app containers were already started earlier, stop them before local testing:

```bash
docker compose stop backend frontend vts-device-simulator
```

## 2. Run Backend Locally

From:

- `code/vts-backend`

Run:

```bash
npm install
npm run start:dev
```

Expected local backend URL:

- `http://localhost:3000`

Swagger:

- `http://localhost:3000/api/docs`

## 3. Run Frontend Locally

From:

- `code/vts-frontend`

Run:

```bash
npm install
npm run dev
```

Expected local frontend URL:

- `http://localhost:5173`

## 4. Run `vts-device-simulator` Locally

From:

- `code/vts-device-simulator`

Run:

```bash
npm install
npm run server
```

In a second terminal, in the same folder, run:

```bash
npm run dev
```

Important rule:

- `npm run dev` starts only the Vite UI
- `npm run server` starts the simulator Express API on port `3011`
- for full local testing you need both processes

Expected local simulator endpoints:

- UI: `http://localhost:5173` when using Vite dev server for the simulator UI
- API/server: `http://localhost:3011`

If you are already using port `5173` for the main frontend, Vite may choose another free port for the simulator UI. That is fine.

## 5. What To Verify Before Docker

Check:

- backend is reachable
- frontend loads and can call the backend
- simulator server responds on `/health`
- simulator `/devices` loads assigned devices from DB
- simulator can publish to MQTT, TCP, or UDP
- backend receives telemetry from the simulator
- frontend reflects the backend state correctly

## Common Local Errors

### `connect ECONNREFUSED 127.0.0.1:1883`

Meaning:

- Mosquitto is not running locally on port `1883`

Fix:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose up -d mosquitto
```

### `EADDRINUSE 0.0.0.0:3000`

Meaning:

- something is already using the backend HTTP port

Usually:

- an old local backend process is still running
- or the Docker `backend` container is already running

Fix:

```bash
docker compose stop backend
```

Then stop any old local backend process if needed.

### `EADDRINUSE 0.0.0.0:4001` or `EADDRINUSE 0.0.0.0:4002`

Meaning:

- the backend UDP/TCP ingestion ports are already in use

Usually:

- another backend instance is already running

Fix:

- stop Docker `backend`
- stop any older local backend process

### Port Ownership Check

If you need to see what is using the ports:

```bash
lsof -nP -i :3000 -i :4001 -i :4002 -i :1883
```

## 6. After Local Testing Passes

After the local workflow is successful, you can build and run the full Docker stack.

Before switching to Docker:

- close the local backend terminal
- close the local frontend terminal
- close the simulator server terminal
- close the simulator Vite UI terminal
- do not leave local app processes running while starting Docker app containers

If you want a clean Docker handoff, stop any old app containers first:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose stop backend frontend vts-device-simulator
```

From the repository root:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose up -d --build
```

If you want a fully clean restart:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose down
docker compose up -d --build
```

This is the correct workflow:

1. test with local `npm` commands first
2. confirm backend, frontend, simulator, and infra all work together
3. stop the local app terminals
4. start the Docker stack from the repository root
5. validate the same flow again in Docker

## Recommended Development Pattern

Use this order during development:

1. test locally with `npm` commands
2. fix issues while feedback is fast
3. keep only infrastructure in Docker during local app testing
4. build containers only after local behavior is correct
5. validate the same flow again in Docker

## Simulator Localhost Rule

For local testing, `vts-device-simulator` is now localhost-first:

- it loads assigned devices from local PostgreSQL
- it publishes MQTT to `mqtt://localhost:1883`
- it sends TCP to `127.0.0.1:4002`
- it sends UDP to `127.0.0.1:4001`
- the MQTT telemetry topic remains `vts/devices/<device_id>/telemetry`

This means local validation and Docker validation follow the same functional path.

The only networking difference is:

- local `npm` testing uses `localhost` or `127.0.0.1`
- Docker containers use Compose service names like `postgres`, `mosquitto`, and `backend`
- AWS Docker deployment follows the same container behavior as local Docker, just on the AWS host

## Quick Command Summary

Infrastructure only:

```bash
docker compose up -d postgres mosquitto redis temporal temporal-ui
```

Backend:

```bash
cd code/vts-backend
npm run start:dev
```

Frontend:

```bash
cd code/vts-frontend
npm run dev
```

Simulator server:

```bash
cd code/vts-device-simulator
npm run server
```

Simulator UI:

```bash
cd code/vts-device-simulator
npm run dev
```

Full Docker build after local verification:

```bash
cd /home/maheshkumar/projects/CLG_VTS
docker compose up -d --build
```
