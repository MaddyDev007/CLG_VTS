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

Current device statuses:

- `pending_registration`
- `assigned`
- `unassigned`

Important distinction:

- `pending_registration` = device was discovered via telemetry but has not been approved and bound yet
- `unassigned` = device exists as a known record, but is intentionally not currently bound to a vehicle
- `unassigned` is not the same as `pending_registration`

Current implementation:

- [Device entity](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/devices/device.entity.ts#L1)

## Lifecycle Flow

```text
Unknown firmware device boots
  -> telemetry reaches backend
  -> backend validates topic and payload
  -> backend creates or updates `pending_registration` device record
  -> backend stores quarantined payload summary
  -> admin reviews pending device
  -> admin binds device to college and vehicle
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

- ingestion quarantines unknown or unassigned devices instead of mutating operational fleet state
- pending devices are tracked for later admin registration
- historical quarantined telemetry is not replayed automatically into trip/event pipelines after assignment

## Retirement

When a device is retired:

- stop telemetry publishing
- unassign from vehicle
- retain operational history
- prevent stale device data from continuing to mutate active fleet state
