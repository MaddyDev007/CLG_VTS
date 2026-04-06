# Repository Structure

## Repository Map

## `vts-frontend/`

Purpose:

- operator and admin UI
- dashboard, map, telemetry, events, history, colleges, users

Owns:

- routing
- view state
- presentation-only transformations
- scoped API calls

Must not:

- compute canonical fleet business logic
- derive authoritative trips/events from raw telemetry
- bypass backend auth or tenant scoping
- invent placeholder production data

## `vts-backend/`

Purpose:

- system of record for telemetry ingestion and operational logic
- tenancy, RBAC, fleet state, event generation, persistence

Owns:

- JWT auth
- MQTT subscription
- telemetry normalization
- geofence enter/exit detection
- trip/event computation
- tenant scoping
- REST and websocket delivery

Must not:

- depend on frontend-side calculations for correctness
- duplicate stop persistence paths outside `StopEventsService`
- trust client-supplied tenancy overrides for scoped actors

## `Firmware/`

Purpose:

- embedded logic for real devices
- GPS/LTE/MQTT communication

Owns:

- hardware I/O
- local buffering
- message publishing
- connectivity recovery

Must not:

- assume always-on connectivity
- encode backend-only business logic
- emit arbitrary schema variations

## `vts-device-simulator/`

Purpose:

- backend-facing telemetry simulator for assigned devices already present in DB

Owns:

- loading assigned devices from DB
- MQTT publishing loop
- route/random motion generation

Must not:

- diverge from firmware message contracts
- publish impossible “perfect” data forever
- bypass backend validation by writing directly to operational tables

## `simulator/`

Purpose:

- manual/UI-based telemetry publisher for testing and demos

Owns:

- operator-driven drive simulation
- publish bridge for test telemetry

Must not:

- become the primary contract source
- define a different payload schema than firmware/backend contracts

## Boundary Rules

- Backend is the source of truth for data validity.
- Frontend is the source of truth for UX only.
- Firmware and simulators are sources of telemetry only.
- Control Tower docs are the source of truth for cross-repo contracts.
