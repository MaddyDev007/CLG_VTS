# Device Lifecycle

## States

Recommended lifecycle:

1. created
2. pending_registration
3. assigned
4. active
5. offline-buffering
6. reconnecting
7. retired

## Current Backend Model

Current device statuses implemented in [Device entity](../../../vts-backend/src/modules/devices/device.entity.ts):

- `assigned`
- `unassigned`

Current implementation notes:

- devices are created explicitly through the backend API
- `unassigned` means the device exists, belongs to a college, and is not bound to a vehicle
- `assigned` means the device is bound to a vehicle and can feed operational telemetry
- `pending_registration` is a recommended future state, but it is not implemented in the current entity

Current telemetry interval storage:

- `telemetryIntervalMs` lives on the device record and defaults to `5000`

## Lifecycle Flow

```text
Unknown firmware device boots
  -> telemetry reaches backend
  -> backend validates topic and payload
  -> current backend ignores unknown-device telemetry after logging
  -> admin creates the device record with `deviceId`, `imei`, and college scope
  -> admin assigns the device to a vehicle
  -> future telemetry enters normal operational path
  -> events/trips/notifications derive only after valid assignment
  -> device may go offline and queue data
  -> device reconnects and flushes queue
```

## Offline Behavior

Required behavior:

- continue sampling
- queue payloads locally
- flush in order after reconnect

Current simulator and sample firmware do not fully implement this yet.

## Assignment Rules

- a device must not be assigned cross-college unless explicitly allowed by backend policy
- unassigned devices must not appear moving
- orphaned telemetry must not create vehicle motion state

Current backend behavior:

- unknown devices are ignored after logging and do not mutate fleet state
- known but unassigned devices are ignored by the operational ingestion path
- the current schema does not store quarantine rows or pending-device discovery metadata
- historical ignored telemetry is not replayed automatically after assignment

## Retirement

When a device is retired:

- stop telemetry publishing
- unassign from vehicle
- retain operational history
- prevent stale device data from continuing to mutate active fleet state
