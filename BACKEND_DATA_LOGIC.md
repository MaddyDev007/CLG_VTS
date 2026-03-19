# Backend Data Logic Audit

This document lists backend-derived data that is calculated before being stored or returned.

## Derived Fields and Calculations

| Field / Value | File | Function | Calculation Logic | Stored or Returned | Meaning |
| --- | --- | --- | --- | --- | --- |
| `deviceId` fallback | `vts-backend/src/mqtt/telemetry.handler.ts` | `handle()` | Uses `data.device_id` or parses device id from MQTT topic `vts/devices/{id}/telemetry` | used for processing | Allows telemetry ingestion even when payload omits device id. |
| `timestamp` fallback | `vts-backend/src/mqtt/telemetry.handler.ts` | `handle()` | Uses `payload.timestamp` if present, otherwise `new Date()` | stored in `telemetry.timestamp` | Ensures all telemetry rows have a timestamp. |
| `record` normalization | `vts-backend/src/mqtt/telemetry.handler.ts` | `handle()` | Coerces `lat/lon/speed/battery/signal` to numbers, sets `address` empty | stored in `telemetry` | Normalizes incoming telemetry into numeric fields. |
| `vehicle.status` (MQTT path) | `vts-backend/src/mqtt/telemetry.handler.ts` | `handle()` | `maintenance` stays; else `speed > 5 ? moving : speed > 0 ? idling : offline` | stored in `vehicles.status` | Live status classification based on speed and maintenance override. |
| `telemetry broadcast status` | `vts-backend/src/mqtt/telemetry.handler.ts` | `handle()` | Same status logic as above | returned via websocket | Real-time status for clients on the `/telemetry` websocket. |
| `tripDistanceKm` | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | Incremented by `calculateDistanceKm(lastPoint, currentPoint)` | stored in memory, later used to end trip | Accumulated distance for the active trip. |
| `overspeed` detection | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | If `speed > speedLimitKmph` and not `overspeedActive` then create overspeed event; reset when `speed <= limit` | stored in `overspeed_events` | Captures the start of an overspeed incident. |
| `idling` detection | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | If `ignition && speed == 0` for `idleThresholdMs`, compute `durationMs = endTime - startTime`, persist seconds in `idling_events.duration` | stored in `idling_events` | Detects prolonged idling with ignition on (canonical duration is ms). |
| `stop` detection | `vts-backend/src/modules/events/stop-events.service.ts` | `buildStopEventsQuery()` | Computes `durationMs = (endTime - startTime) * 1000` in SQL | returned by API | Detects prolonged stops with ignition off (canonical duration is ms). |
| `trip start` | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | When `ignition && speed > 5` and no active trip, create trip | stored in `trips` | Begins a trip when movement starts. |
| `trip playback point` | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | Adds a playback point for every telemetry while trip is active | stored in `trip_playback_points` | Enables trip playback on the frontend. |
| `trip end` | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | When `ignitionOffSince` exceeds threshold, end trip and persist distance | stored in `trips` | Completes the trip after sustained ignition-off. |
| `distance` (trip) | `vts-backend/src/mqtt/telemetry.handler.ts` | `handleTripsAndEvents()` | Uses `tripDistanceKm` accumulated by haversine formula | stored in `trips.distance` | Total distance traveled during the trip. |
| `trip duration` | `vts-backend/src/modules/trips/trips.service.ts` | `endTrip()` | `durationMs = endTime - startTime`, persisted as minutes in `trips.duration` | stored in `trips.duration` | Trip length in milliseconds (canonical), stored as minutes for legacy storage. |
| `vehicle.status` (HTTP ingest) | `vts-backend/src/modules/telemetry/telemetry.service.ts` | `ingest()` | `speed > 5 ? moving : speed > 0 ? idling : ignition ? idling : offline` | stored in `vehicles.status` | Status classification for HTTP-ingested telemetry. |
| `vehicle.status` (query-time) | `vts-backend/src/modules/vehicles/vehicles.service.ts` | `applyTelemetryStatus()` | If last telemetry older than 2 min => offline; else `speed > 5` => moving; `ignition && speed==0` => idling; else offline | returned by API | Provides live-ish status when listing vehicles. |
| `status counts` | `vts-backend/src/modules/vehicles/vehicles.service.ts` | `getStatusCounts()` | Reduces vehicles into `{total, moving, idling, offline, maintenance}` | returned by API | Dashboard counts by vehicle status. |
| `route.stopsCount` | `vts-backend/src/modules/routes/routes.service.ts` | `create()`, `update()` | `2 + intermediateStops.length` on create; recomputed based on start/end/intermediate on update | stored in `routes.stopsCount` | Number of stops shown on routes list. |
| `route.status` | `vts-backend/src/modules/routes/routes.service.ts` | `create()`, `update()` | `assignedVehicleId ? 'active' : 'idle'` | stored in `routes.status` | Indicates whether a route is assigned to a vehicle. |
| `notification.message` | `vts-backend/src/modules/events/events.service.ts` | `createOverspeed()` / `createIdling()` / `createStop()` | Builds message like `${vehicleName} overspeed detected` | stored in `notifications.message` | Human-readable notification text. |
| `history.lastLocation` | `vts-backend/src/modules/history/history.service.ts` | `listVehiclesHistory()`, `getVehicleHistory()` | Uses `lastTelemetry.address ?? vehicle.address ?? 'Unknown'` | returned by API | Latest known location for history summary. |
| `history.lastSeen` | `vts-backend/src/modules/history/history.service.ts` | `listVehiclesHistory()`, `getVehicleHistory()` | Uses `lastTelemetry.timestamp ?? vehicle.lastSeen ?? new Date()` | returned by API | Latest seen timestamp for history summary. |
| `history.totalDistance` / `totalTrips` | `vts-backend/src/modules/history/history.service.ts` | `listVehiclesHistory()`, `getVehicleHistory()` | Hard-coded `0` in response | returned by API | Placeholder totals for history summary. |

## Data Flow Summary

Telemetry Device
   ↓
MQTT topic
   ↓
Backend processing
   ↓
Database tables
   ↓
API responses
   ↓
Frontend derived states
