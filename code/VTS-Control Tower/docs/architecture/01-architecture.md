# Architecture

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                           VTS Control Tower                    │
│                 Central docs, operations, repository rules     │
└─────────────────────────────────────────────────────────────────┘

         Device / Firmware                  Simulator(s)
      ┌────────────────────┐       ┌──────────────────────────┐
      │ ESP32 + EC25 + GPS │       │ vts-device-simulator     │
      │ LTE / MQTT client  │       │ simulator UI + bridge    │
      └─────────┬──────────┘       └────────────┬─────────────┘
                │                                │
                └──────────── MQTT topics ───────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ MQTT Broker          │
                    │ topic: vts/devices/* │
                    └─────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ NestJS Backend       │
                    │ MqttService          │
                    │ TelemetryHandler     │
                    └─────────┬────────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
   Ingestion / Normalize   Processing       API / Delivery
   TelemetryService        TripsService     REST controllers
   Device/Vehicle resolve  EventsService    JWT auth
   Geocoder / Geofences    StopEvents SQL   Socket.IO gateway
             │                │                │
             └────────────────┴────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ PostgreSQL           │
                    │ telemetry, trips,    │
                    │ events, users,       │
                    │ colleges, routes     │
                    └─────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ React Frontend       │
                    │ dashboards, maps,    │
                    │ history, alerts      │
                    └──────────────────────┘
```

## Layers

## Ingestion Layer

Implemented primarily in:

- [MqttService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/mqtt.service.ts)
- [TelemetryHandler](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/telemetry.handler.ts)
- [TelemetryService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/telemetry/telemetry.service.ts)

Responsibilities:

- subscribe to MQTT telemetry topic
- parse payloads
- resolve `deviceId` from payload or topic
- validate that the device is assigned
- resolve tenant and vehicle ownership
- enrich telemetry with address and geofence state

## Processing Layer

Implemented primarily in:

- [TelemetryHandler](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/telemetry.handler.ts)
- [TripsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/trips/trips.service.ts)
- [EventsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/events.service.ts)
- [StopEventsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/stop-events.service.ts)

Responsibilities:

- compute moving/idling/offline/stopped vehicle state
- compute trip start, update, end
- compute overspeed and idling events
- derive stop events from telemetry without persisting duplicate stop rows
- create notifications from geofence and event transitions

## Storage Layer

Implemented in PostgreSQL through TypeORM entities and migrations:

- tenancy: `colleges`, `users`
- operational: `vehicles`, `devices`, `routes`, `geofences`
- telemetry: `telemetry`
- derived history: `trips`, `trip_playback_points`
- derived events: `overspeed_events`, `idling_events`
- operational alerts: `notifications`

## API Layer

Implemented in NestJS controllers:

- REST for authentication, CRUD, queries, and operational views
- WebSocket namespace `/telemetry` for live vehicle updates

## Messaging vs REST

Messaging and REST must remain separate concerns.

Messaging:

- transports device-originated telemetry and device-targeted commands
- must tolerate intermittent connectivity
- is asynchronous
- must be idempotent enough for reconnect/retry behavior

REST:

- serves authenticated operator and admin workflows
- returns processed and scoped data
- must never replace ingestion processing logic

Rule:

- telemetry ingestion and event generation are messaging-driven
- dashboards and tables are REST-driven
