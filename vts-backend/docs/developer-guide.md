# Developer Guide

## Install
```bash
cd vts-backend
npm install
```

## Run database (PostgreSQL only)
```bash
docker compose up -d
```

## Start API (local)
```bash
npm run start:dev
```

## Swagger
```
http://localhost:3000/api/docs
```

## Temporal (optional)
Temporal is not provisioned by Docker Compose. If you want to use it:
- Run a Temporal server separately
- Set `TEMPORAL_ADDRESS` in `.env`

## Device simulator (MQTT)
```
cd ../vts-device-simulator
npm install
node simulator.js
```
