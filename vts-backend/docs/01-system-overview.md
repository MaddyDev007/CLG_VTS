# System Overview

## Project purpose
The VTS backend ingests live vehicle telemetry, stores operational data in PostgreSQL, and exposes REST + WebSocket interfaces for the dashboard.

## Problem statement
Fleet operators need real‑time visibility and historical insights across vehicles, routes, and events (overspeed, idling, stop). The system must ingest telemetry reliably, persist it, and stream updates to clients.

## High‑level architecture
```
Devices / Simulator
   | (MQTT or HTTP)
   v
NestJS Backend -> PostgreSQL
   |-> WebSocket (Socket.IO) -> Dashboard
   |-> REST API -> Dashboard / Admin tools
```

## System components
- **Edge devices (e.g., ESP32/IoT trackers)**
  - Publish telemetry to MQTT topic `vts/<deviceId>/telemetry`.
- **Device simulator (Node.js)**
  - Sends MQTT telemetry to the broker (see `vts-device-simulator`).
- **MQTT Broker (Mosquitto, optional)**
  - Receives device messages and delivers them to the backend subscriber.
- **Backend API (NestJS + TypeORM)**
  - Validates telemetry, maps devices to vehicles, stores data.
  - Detects trips/events and generates notifications.
  - Exposes REST endpoints for management and analytics.
- **Database (PostgreSQL)**
  - Stores users, vehicles, devices, telemetry, trips, routes, events, notifications.
- **WebSocket gateway (Socket.IO)**
  - Emits `vehicle-update` for live map updates.
- **Dashboard client (React/Vite)**
  - Consumes REST + WebSocket data.
- **Temporal (optional)**
  - Workflow engine for long‑running trip/event orchestration (requires external server).

## Data flow (end‑to‑end)
1. Device publishes telemetry to `vts/<deviceId>/telemetry` or a simulator posts to `POST /telemetry`.
2. Backend validates payload and maps `deviceId` to a vehicle.
3. Telemetry normalized and stored in PostgreSQL.
4. Trips/events are detected and persisted.
5. WebSocket emits `vehicle-update` to dashboard.
6. REST endpoints serve analytics and history.
