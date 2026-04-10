# Event Processing

## Principles

- event computation is backend-driven
- telemetry is the raw operational input
- frontend only displays the processed output
- stop computation must remain single-source-of-truth

## Current Processing Entry Point

Primary runtime path:

- [TelemetryHandler](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/telemetry.handler.ts#L1)

## Overspeed

Current logic:

- if `speed > speedLimit` and no active overspeed event, create one
- while still overspeeding, update max speed and duration
- when speed falls back below limit, finalize duration

Source of truth:

- [EventsService.createOverspeed](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/events.service.ts#L1)

## Idling

Current logic:

- ignition on
- speed equals zero
- sustained for configured threshold
- backend creates idling event on exit from the idling state

Current threshold:

- 60 seconds in `TelemetryHandler`

## Stop

Current logic:

- stop events are derived from telemetry ignition transitions
- computed in SQL, not persisted through a second writer

Source of truth:

- [StopEventsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/stop-events.service.ts#L1)

Important rule:

- do not add a duplicate persistent stop-event writer elsewhere

## Trip Aggregation

Current trip logic:

- start when ignition/movement indicates a trip
- accumulate distance incrementally
- add playback points during active trip
- end after ignition-off timeout

Current protections:

- large GPS spikes are skipped
- active trip state is held in memory by `TelemetryHandler`

## Geofence Events

Current logic:

- each telemetry sample checks closest matching geofence
- backend compares previous geofence to current geofence
- backend emits enter/exit notifications with geofence names

## Aggregation Rules

- durations should be canonicalized to one standard unit
- event creation belongs in backend services only
- frontend filters may narrow event lists but must never create event rows
