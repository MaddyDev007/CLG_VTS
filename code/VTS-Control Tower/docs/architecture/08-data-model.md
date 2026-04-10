# Data Model

This document defines the operational model and the preferred contract-level field semantics.

## Time Standard

Target standard:

- all externally defined event and telemetry timestamps should be epoch milliseconds

Current implementation:

- PostgreSQL stores many fields as `timestamptz`
- API responses often serialize as ISO strings

Migration target:

- preserve SQL storage if desired
- normalize API/device contracts so one field name maps to one time unit

## Core Entities

## `colleges`

- `id: uuid`
- `name: string`
- `code: string | null`
- `status: active | disabled`

## `users`

- `id: uuid`
- `name: string`
- `email: string`
- `role: SUPER_ADMIN | COLLEGE_ADMIN | FLEET_MANAGER | STUDENT`
- `collegeId: uuid | null`
- `status: active | disabled`

## `vehicles`

- `id: uuid`
- `registrationNumber: string`
- `vehicleName: string`
- `vehicleType: Bus | Car | Van | Truck`
- `collegeId: uuid | null`
- `deviceId: string | null`
- `routeId: uuid | null`
- `status: moving | idling | stopped | offline`
- `speed: number`
- `speedLimit: number`
- `lat: number | null`
- `lon: number | null`
- `address: string | null`
- `lastSeen: timestamp`

## `devices`

- `id: uuid`
- `deviceId: string`
- `imei: string | null`
- `collegeId: uuid | null`
- `assignedVehicleId: uuid | null`
- `assignedVehicleName: string | null`
- `status: assigned | unassigned | pending_registration`
- `firstSeenAt: timestamp | null`
- `lastSeenAt: timestamp | null`
- `lastTelemetryTimestamp: timestamp | null`
- `discoveryMessageCount: number`
- `lastKnownLat: number | null`
- `lastKnownLng: number | null`
- `lastKnownSignal: number | null`
- `lastKnownBattery: number | null`
- `lastQuarantineReason: unknown_device | unassigned_device | malformed_payload | null`

## `pending_device_messages`

- `id: uuid`
- `deviceId: string`
- `deviceRecordId: uuid | null`
- `rawPayload: string`
- `topic: string`
- `firstSeenAt: timestamp`
- `lastSeenAt: timestamp`
- `telemetryTimestamp: timestamp | null`
- `lat: number | null`
- `lng: number | null`
- `battery: number | null`
- `signal: number | null`
- `messageCount: number`
- `processingStatus: pending | registered | ignored`
- `reason: unknown_device | unassigned_device | malformed_payload`

Purpose:

- quarantine and audit for telemetry that is not allowed into the operational pipeline
- preserve traceability for unknown and unassigned devices
- support later registration and installer workflows

Non-goals:

- not part of operational telemetry
- not used for fleet analytics
- not replayed automatically into trips or events

## `telemetry`

Required fields:

- `id: uuid`
- `vehicleId: uuid`
- `deviceId: string`
- `collegeId: uuid | null`
- `timestamp`
- `lat: number`
- `lon: number`
- `speed: number`
- `ignition: boolean`
- `battery: number`
- `signal: number`
- `address: string`
- `geofenceId: uuid | null`
- `geofenceName: string | null`

Operational rule:

- only known, assigned devices may create rows in `telemetry`
- unknown or unassigned device messages must be held in `pending_device_messages` instead

## `trips`

Required fields:

- `id: uuid`
- `vehicleId: uuid`
- `collegeId: uuid | null`
- `vehicleName: string`
- `startLocation: string`
- `endLocation: string`
- `startTime`
- `endTime`
- `duration`
- `distance`

## `trip_playback_points`

- `id: uuid`
- `tripId: uuid`
- `timestamp`
- `lat: number`
- `lon: number`
- `speed: number`

## `overspeed_events`

- `id: uuid`
- `vehicleId: uuid`
- `collegeId: uuid | null`
- `tripId: uuid`
- `maxSpeed: number`
- `speedLimit: number`
- `duration`
- `startTime`
- `endTime`
- `location`
- `lat`
- `lon`

## `idling_events`

- `id: uuid`
- `vehicleId: uuid`
- `collegeId: uuid | null`
- `tripId: uuid`
- `duration`
- `startTime`
- `endTime`
- `location`
- `lat`
- `lon`

## `notifications`

- `id: uuid`
- `type: overspeed | geofence_enter | geofence_exit | idling | stop`
- `collegeId: uuid | null`
- `vehicleId: uuid`
- `vehicleName: string`
- `message: string`
- `location: string`
- `timestamp`
- `read: boolean`

## Modeling Notes

- `route_stops` may remain route-owned rather than storing a duplicated `collegeId`.
- `profile_preferences` remain user-owned rather than device/vehicle-owned.
- stop events are currently derived from telemetry and intentionally not persisted as a second write path.
- `pending_device_messages` is intentionally deduplicated by `deviceId` to avoid unbounded DB growth from repeated unknown-device retries.
