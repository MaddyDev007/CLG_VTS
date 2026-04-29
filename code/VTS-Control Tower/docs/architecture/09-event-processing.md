# Event Processing

## Principles

- event computation is backend-driven
- telemetry is the raw operational input
- frontend only displays the processed output
- stop computation must remain single-source-of-truth

## Current Processing Entry Point

Primary runtime path:

- [TelemetryHandler](../../../vts-backend/src/mqtt/telemetry.handler.ts)

## Overspeed

Current logic:

- if `speed > speedLimit` and no active overspeed event, create one
- while still overspeeding, update max speed and duration
- when speed falls back below limit, finalize duration

Source of truth:

- [EventsService.createOverspeed](../../../vts-backend/src/modules/events/events.service.ts)

## Idling

Current logic:

- ignition on
- speed equals zero
- sustained for configured threshold
- backend creates idling event once the threshold is reached, updates it while idling continues, and finalizes it when motion resumes or ignition turns off

Current threshold:

- 60 seconds in `TelemetryHandler`

## Stop

Current logic:

- stop events are derived from telemetry ignition transitions
- computed in SQL, not persisted through a second writer

Source of truth:

- [StopEventsService](../../../vts-backend/src/modules/events/stop-events.service.ts)

Important rule:

- do not add a duplicate persistent stop-event writer elsewhere

## Trip Aggregation

Current trip logic:

- start or resume when ignition is true and a valid assigned-device telemetry sample arrives
- accumulate distance incrementally
- add playback points during active trip
- end after ignition-off timeout

Current protections:

- large GPS spikes are skipped
- active trip/event state is held by `TelemetryStateService`, which uses Redis when configured and otherwise falls back to memory

## Geofence Events

Current logic:

- each telemetry sample checks closest matching geofence
- backend compares previous geofence to current geofence
- backend emits enter/exit notifications with geofence names

## Aggregation Rules

- durations should be canonicalized to one standard unit
- event creation belongs in backend services only
- frontend filters may narrow event lists but must never create event rows
