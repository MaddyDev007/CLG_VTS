# Debugging Guide

## First Questions

When something breaks, determine which layer is failing:

- device/firmware
- simulator
- MQTT transport
- backend ingestion
- database
- REST API
- frontend rendering

## Common Checks

## 1. Device / Simulator Not Visible

Check:

- correct MQTT broker URL
- same broker host/port across firmware, backend, and `vts-device-simulator`
- `vts-device-simulator` `/devices` returns real assigned devices from DB
- simulator UI is not falling back to a synthetic device id or synthetic topic preview
- topic format
- payload schema
- device assignment in DB
- pending/quarantine device status

Relevant files:

- [mqtt.config.ts](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/config/mqtt.config.ts#L1)
- [mqtt.service.ts](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/mqtt.service.ts#L1)
- [telemetry.handler.ts](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/mqtt/telemetry.handler.ts#L1)
- [devices.service.ts](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/devices/devices.service.ts#L1)

## 2. Telemetry Arrives But Vehicle Does Not Update

Check:

- device assignment
- `vehicleId` resolution
- malformed numeric fields
- signal/lat/lon validity
- whether the message was quarantined as `unknown_device`, `unassigned_device`, or `malformed_payload`

Telemetry missing in UI?

Check:

1. device exists
2. device is assigned
3. message exists in the quarantine table
4. ingestion reason:
   - `unknown_device`
   - `unassigned_device`
   - `malformed_payload`

## 3. Vehicle Moves While Unassigned

This must not happen.

Check:

- device assignment cleanup
- ingestion path allowing orphaned device data
- stale simulator device publishing
- quarantine branch accidentally bypassed

## 4. Geofence Alerts Missing Names

Check:

- geofence rows exist
- telemetry geofence matching path
- notification creation path

Relevant file:

- [TelemetryService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/telemetry/telemetry.service.ts#L1)

## 5. Stop / Idling / Overspeed Mismatch

Check:

- current thresholds
- ignition state
- speed unit consistency
- duplicate writer paths

Relevant files:

- [EventsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/events.service.ts#L1)
- [StopEventsService](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/modules/events/stop-events.service.ts#L1)

## 6. Frontend Shows Wrong College Data

Check:

- current selected college context for super admin
- page service call includes `collegeId`
- backend endpoint actually scopes by `collegeId`

Relevant files:

- [useCurrentCollegeContext.ts](/home/user/Desktop/codex%20vts%20v2/vts-frontend/src/hooks/useCurrentCollegeContext.ts#L1)
- [access-scope.service.ts](/home/user/Desktop/codex%20vts%20v2/vts-backend/src/common/services/access-scope.service.ts#L1)

## 7. Playback Duration Looks Wrong

Check:

- input timestamp unit
- storage unit
- API serialization unit
- frontend formatting utility

This is especially sensitive because current code still mixes SQL timestamps, ISO strings, and duration conversion helpers.

## Development Startup

Current local workflow:

1. start shared infrastructure from the repository root `docker-compose.yml`
2. start Nest backend with `npm run start:dev`
3. start frontend with `npm run dev`
4. start `vts-device-simulator` with both `npm run server` and `npm run dev`
5. after local validation passes, stop the local app terminals and then run `docker compose up -d --build`

See:

- [local-testing-guide.md](/home/maheshkumar/projects/CLG_VTS/code/VTS-Control%20Tower/docs/operations/local-testing-guide.md)

Current shared MQTT test choice:

- local testing typically uses Mosquitto on `localhost:1883`
- backend and simulator containers use `mqtt://mosquitto:1883` internally
- external firmware must target the host machine LAN/public IP or domain on port `1883`
- all publishers and subscribers must target the same broker instance for end-to-end validation

## Debugging Rule

Always trace the same telemetry sample across:

- publish payload
- MQTT topic
- backend handler
- quarantine row or DB row
- event/trip rows
- API response
- UI display

## Unknown Device Workflow

If telemetry arrives before device registration:

1. confirm the payload reached MQTT with the expected topic
2. confirm `TelemetryHandler` extracted `deviceId`
3. check `devices` for `pending_registration`
4. check `pending_device_messages` for updated `firstSeenAt`, `lastSeenAt`, and `messageCount`
5. confirm no `telemetry`, `trip`, `event`, or vehicle-status mutation was created
