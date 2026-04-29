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
- current device status (`assigned` or `unassigned`)

Relevant files:

- [mqtt.config.ts](../../../vts-backend/src/config/mqtt.config.ts)
- [mqtt.service.ts](../../../vts-backend/src/mqtt/mqtt.service.ts)
- [telemetry.handler.ts](../../../vts-backend/src/mqtt/telemetry.handler.ts)
- [devices.service.ts](../../../vts-backend/src/modules/devices/devices.service.ts)

## 2. Telemetry Arrives But Vehicle Does Not Update

Check:

- device assignment
- `vehicleId` resolution
- malformed numeric fields
- signal/lat/lon validity
- whether the message was ignored because the device is unknown, unassigned, or the payload is malformed

Telemetry missing in UI?

Check:

1. device exists
2. device is assigned
3. topic segment matches the registered device IMEI for MQTT telemetry
4. payload numeric fields are valid
5. backend logs show the MQTT message reached `TelemetryHandler`

## 3. Vehicle Moves While Unassigned

This must not happen.

Check:

- device assignment cleanup
- ingestion path allowing orphaned device data
- stale simulator device publishing
- safe ingestion guard accidentally bypassed

## 4. Geofence Alerts Missing Names

Check:

- geofence rows exist
- telemetry geofence matching path
- notification creation path

Relevant file:

- [TelemetryService](../../../vts-backend/src/modules/telemetry/telemetry.service.ts)

## 5. Stop / Idling / Overspeed Mismatch

Check:

- current thresholds
- ignition state
- speed unit consistency
- duplicate writer paths

Relevant files:

- [EventsService](../../../vts-backend/src/modules/events/events.service.ts)
- [StopEventsService](../../../vts-backend/src/modules/events/stop-events.service.ts)

## 6. Frontend Shows Wrong College Data

Check:

- current selected college context for super admin
- page service call includes `collegeId`
- backend endpoint actually scopes by `collegeId`

Relevant files:

- [collegeFilterStore.ts](../../../vts-frontend/src/store/collegeFilterStore.ts)
- [tenant-scope.ts](../../../vts-backend/src/common/tenant/tenant-scope.ts)

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

- [local-testing-guide.md](local-testing-guide.md)

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
- backend log or telemetry DB row
- event/trip rows
- API response
- UI display

## Unknown Device Workflow

If telemetry arrives before device registration:

1. confirm the payload reached MQTT with the expected topic
2. confirm `TelemetryHandler` extracted the topic identifier
3. check that `devices.imei` contains that identifier
4. create/register the device if it is missing
5. assign it to a vehicle before expecting operational telemetry
6. confirm no `telemetry`, `trip`, `event`, or vehicle-status mutation was created before assignment
