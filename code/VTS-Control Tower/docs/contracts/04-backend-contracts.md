# Backend Contracts

## Responsibilities

The backend must:

- process MQTT telemetry
- persist operational state
- compute trips and events
- expose authenticated REST APIs
- enforce RBAC and college scoping

It must not be reduced to a CRUD-only REST layer.

## API Response Standard

Preferred standard:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Current-state note:

- current codebase is mixed
- some endpoints return raw entities
- some endpoints return `{ success, message, ... }`

Rule going forward:

- new APIs should use a consistent envelope unless an existing response shape is intentionally preserved for compatibility

## Error Format

Preferred standard:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Human-readable message"
  }
}
```

Current-state note:

- Nest default exception JSON is currently used in several places

## Time Unit Rules

Non-negotiable contract:

- a single endpoint must not mix epoch milliseconds and ISO strings
- one field name must map to one time unit everywhere

Target standard:

- all device and analytics contracts use epoch ms

Current implementation:

- DB entities are `timestamptz`
- many REST responses serialize to ISO strings
- old MQTT ingestion expects ISO timestamps in the legacy payload shape

This must be treated as technical debt to normalize, not as the desired long-term contract.

## Messaging Contract

Backend must process messages from MQTT:

- current topic default: `vts/devices/+/telemetry`
- current MQTT payload fields: `timestamp`, `lat`, `lon`, `speed_kmph`, `battery_mv`, `signal_dbm`, `ignition`
- current MQTT device lookup uses the telemetry topic segment as the device IMEI; the simulator also sends `imei_no`
- current subscriber: [MqttService](../../../vts-backend/src/mqtt/mqtt.service.ts)
- current handler: [TelemetryHandler](../../../vts-backend/src/mqtt/telemetry.handler.ts)

REST must not replace MQTT ingestion logic.

## Tenant and Auth Contract

The authenticated actor context must include:

- `userId`
- `role`
- `collegeId`
- `status`

Current implementation:

- [AuthService](../../../vts-backend/src/modules/auth/auth.service.ts)
- [JwtStrategy](../../../vts-backend/src/modules/auth/jwt.strategy.ts)

Tenant rules:

- `SUPER_ADMIN` may scope reads by explicit `collegeId`
- `COLLEGE_ADMIN`, `FLEET_MANAGER`, `STUDENT` are actor-scoped
- backend ignores or rejects malicious college overrides for scoped actors

## Ingestion Contract

Telemetry ingestion must:

- resolve device and assigned vehicle
- propagate `collegeId`
- enrich address and geofence
- update vehicle state
- feed downstream trip/event creation

Current ingestion branches:

- known device + assigned vehicle -> normal operational path
- known device + unassigned vehicle -> ignored by operational ingestion
- unknown device -> ignored after logging

Unknown or unassigned telemetry must never:

- create or update vehicle motion state
- create trips
- create overspeed, idling, or stop events
- create operational notifications
- pollute fleet dashboards

Future quarantine requirements:

- preserve the raw payload and MQTT topic
- update discovery metadata such as `firstSeen`, `lastSeen`, and `messageCount`
- mark the reason explicitly: `unknown_device`, `unassigned_device`, or `malformed_payload`
- keep the device visible to admin registration workflows without auto-creating a vehicle or college assignment

## Device Ingestion State Model

Device ingestion states:

1. `UNKNOWN_DEVICE`
   - `deviceId` not present in the database
   - current action:
     - log and ignore
     - do not process telemetry into the operational pipeline
   - future action:
     - create a pending device record
     - store the message in quarantine

2. `UNASSIGNED_DEVICE`
   - device exists but is not bound to a vehicle
   - current action:
     - ignore
     - do not update vehicle state
     - do not derive trips, events, or notifications
   - future action:
     - store the message in quarantine

3. `ASSIGNED_DEVICE`
   - device is mapped to a vehicle
   - action:
     - process telemetry normally
     - update vehicle state
     - enable trip and event processing

## Derived Data Contract

Derived events must be backend-driven:

- overspeed
- idling
- stop
- trip start/update/end

Frontend must never re-derive canonical event rows from raw telemetry.
