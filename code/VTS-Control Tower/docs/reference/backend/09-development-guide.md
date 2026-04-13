# Development Guide

## Prerequisites
- Node.js 20+
- Docker + Docker Compose (for PostgreSQL and Mosquitto)

## Install (backend)
```bash
cd vts-backend
npm ci
```

## Run shared infra
```bash
docker compose up -d postgres mosquitto
```

## Start backend (local)
```bash
npm run start:dev
```

## Start frontend (local)
```bash
cd ../vts-frontend
npm ci
npm run dev
```

## MQTT broker (optional)
Run a local Mosquitto broker or a separate container, then set:
- `MQTT_BROKER_URL=mqtt://localhost:1883`

## Device simulator (MQTT)
```bash
cd ../vts-device-simulator
npm ci
npm run server
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
- Temporal is optional and should stay disabled unless you explicitly set `TEMPORAL_ENABLED=true`.
