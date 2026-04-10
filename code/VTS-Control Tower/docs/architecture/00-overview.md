# VTS Control Tower Overview

## What This System Is

The Vehicle Tracking System (VTS) is a multi-repository platform for ingesting device telemetry, computing fleet events, persisting operational history, and presenting that state to operators in a web UI.

The Control Tower repository is the central documentation and coordination layer for:

- `vts-frontend`: operator UI
- `vts-backend`: API, telemetry ingestion, event processing, persistence
- `Firmware`: embedded device logic for GPS/LTE hardware
- `vts-device-simulator`: UI-driven simulator that loads assigned devices and publishes telemetry directly to MQTT, TCP, or UDP

This `VTS-Control Tower/docs` directory is the single source of truth for cross-repository contracts, operating rules, and expected behavior.

## End-to-End Flow

```text
Device / Simulator
  -> MQTT telemetry topic
  -> Backend MQTT subscriber
  -> Telemetry normalization + enrichment
  -> Event/trip/state computation
  -> PostgreSQL persistence
  -> REST/WebSocket delivery
  -> Frontend dashboards, maps, tables, alerts
```

More explicitly:

```text
Device
  -> publishes telemetry
Messaging
  -> MQTT broker transports payload
Backend
  -> validates device, resolves vehicle, enriches address/geofence, computes trips/events
Database
  -> stores telemetry, trips, events, notifications, tenancy
API
  -> exposes scoped data to authenticated users
UI
  -> renders already-processed operational state
```

## Control Tower Purpose

The `VTS-Control Tower` repo exists to:

- define contracts once for all repos
- prevent drift between frontend, backend, firmware, and simulators
- document current implementation and target rules
- give Codex one stable place to reason about invariants before changing code
- stay updated whenever behavior changes in any sibling repo

## Current-State Notes

- The backend is the only authoritative place for ingestion, event computation, and tenant scoping.
- The frontend currently consumes processed REST responses and a shared `/telemetry` websocket namespace.
- MQTT is used for telemetry ingestion; REST is used for management and reporting.
- Current code stores many timestamps as SQL `timestamptz` and returns ISO strings. This differs from the stricter epoch-ms standard defined in this docs set and should be treated as a migration target, not as the desired contract.
