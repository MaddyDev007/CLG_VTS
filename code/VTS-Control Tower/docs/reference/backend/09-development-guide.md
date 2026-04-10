# Development Guide

## Prerequisites
- Node.js 20+
- Docker + Docker Compose (for PostgreSQL)

## Install (backend)
```bash
cd vts-backend
npm install
```

## Run database (PostgreSQL only)
```bash
docker compose up -d
```

## Start backend (local)
```bash
npm run start:dev
```

## Start frontend (local)
```bash
cd ../vts-frontend
npm install
npm run dev
```

## MQTT broker (optional)
Run a local Mosquitto broker or a separate container, then set:
- `MQTT_BROKER_URL=mqtt://localhost:1883`

## Device simulator (MQTT)
```bash
cd ../vts-device-simulator
npm install
node simulator.js
```

## Migrations
```bash
npm run migration:run
```

## Seed data
A default admin user is seeded on startup (see `UsersSeeder`).
- Email: `admin@vts.local`
- Password: `admin123`

## Notes
- Ensure `.env` is present in `vts-backend`.
- JWT is required for protected endpoints.
- Temporal is optional but the backend expects a server at `TEMPORAL_ADDRESS` unless the module is removed.
