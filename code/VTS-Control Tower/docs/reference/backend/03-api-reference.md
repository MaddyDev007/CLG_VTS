# API Reference

Base URL: `http://localhost:3000`

Auth:
- All endpoints below require `Authorization: Bearer <token>` unless marked as `Auth: None`.

---

## Auth

### POST /auth/login
- Auth: None
- Body:
```json
{ "email": "admin@vts.local", "password": "admin123" }
```
- Response:
```json
{ "token": "<jwt>", "role": "SUPER_ADMIN", "name": "Super Admin" }
```

### POST /auth/logout
- Auth: None
- Response:
```json
{ "success": true }
```

---

## Vehicles

### GET /vehicles
- Response: list of vehicles

### GET /vehicles/status-counts
- Response:
```json
{ "total": 10, "moving": 4, "idling": 3, "offline": 2, "maintenance": 1 }
```
Note: `stopped` is derived in the frontend as `total - moving - idling - offline - maintenance`.

### GET /vehicles/:vehicleId
- Path params: `vehicleId` (UUID)
- Response: vehicle

### GET /vehicles/:vehicleId/trips
- Path params: `vehicleId` (UUID)
- Response: trips for vehicle

### GET /vehicles/:vehicleId/telemetry
- Path params: `vehicleId` (UUID)
- Response: telemetry for vehicle

### POST /vehicles
- Body:
```json
{ "vehicleName": "College Bus 1", "vehicleType": "Bus", "deviceId": "VTU_001" }
```
- `vehicleType` allowed: `Bus | Car | Van | Truck`
- `deviceId` is the device UID (string), not the device record UUID.
- Response:
```json
{ "success": true, "message": "Vehicle created", "vehicle": { "id": "<uuid>" } }
```

### PUT /vehicles/:vehicleId
- Body (any of):
```json
{ "vehicleName": "Bus 12", "vehicleType": "Bus", "deviceId": "VTU_001" }
```
- Response:
```json
{ "success": true, "message": "Vehicle updated", "vehicle": { "id": "<uuid>" } }
```

### DELETE /vehicles/:vehicleId
- Response:
```json
{ "success": true, "message": "Vehicle deleted" }
```

---

## Devices

### GET /devices
- Response: list of devices

### GET /devices/unassigned
- Response: devices with no assigned vehicle

### GET /devices/by-uid/:deviceUid
- Path params: `deviceUid` (deviceId string, e.g. `VTU_001`)
- Response: device

### POST /devices
- Body:
```json
{ "deviceId": "VTU_001", "imei": "867451234567890" }
```
- `imei` must be 15 digits
- Response:
```json
{ "success": true, "message": "Device created", "device": { "id": "<uuid>" } }
```

### PUT /devices/:deviceId
- Path params: `deviceId` (device record UUID)
- Body (any of):
```json
{ "deviceId": "VTU_010", "imei": "867451234567890" }
```
- Response:
```json
{ "success": true, "message": "Device updated", "device": { "id": "<uuid>" } }
```

### DELETE /devices/:deviceId
- Path params: `deviceId` (device record UUID)
- Response:
```json
{ "success": true, "message": "Device deleted" }
```

### POST /devices/:deviceUid/assign
- Path params: `deviceUid` (deviceId string)
- Body:
```json
{ "vehicleId": "<uuid>", "vehicleName": "College Bus 1" }
```
- Response:
```json
{ "success": true, "device": { "id": "<uuid>" } }
```

### POST /devices/:deviceUid/unassign
- Path params: `deviceUid` (deviceId string)
- Response:
```json
{ "success": true, "device": { "id": "<uuid>" } }
```

### POST /devices/:deviceId/interval
- Path params: `deviceId` (logical device UID, e.g. `VTU_001`)
- Body:
```json
{ "interval": 10000 }
```
- `interval` must be an integer from `1000` to `60000` milliseconds.
- Behavior: publishes `{"type":"config_update","interval":10000}` to `vts/devices/{deviceId}/commands`, waits up to 10 seconds for a matching ACK on `vts/devices/{deviceId}/ack`, then stores the ACKed interval on the device record.
- Success response:
```json
{ "status": "success", "interval": 10000, "timestamp": "2026-04-29T10:00:00.000Z" }
```
- Timeout response:
```json
{ "status": "timeout" }
```

---

## Telemetry

### GET /telemetry
- Query params (optional):
  - `vehicleId`
  - `ignition` (boolean)
  - `startDate` (string)
  - `endDate` (string)
- Example:
```
GET /telemetry?vehicleId=<uuid>&ignition=true
```
- Response: list of telemetry records

### POST /telemetry
- Body:
```json
{
  "imei_no": "867451234567890",
  "lat": 11.2588,
  "lon": 75.7804,
  "speed": 45,
  "ignition": true,
  "timestamp": "2026-03-12T05:30:00Z"
}
```
- Response: telemetry record

---

## Trips

### GET /trips
- Response: list of trips

### GET /trips/:tripId
- Response: trip details

### GET /trips/:tripId/playback
- Response: playback points for trip

---

## Events

### GET /events/overspeed
- Query params (optional): `vehicleId`, `speedLimit`, `startDate`, `endDate`
- Response: list of overspeed events

### GET /events/overspeed/:id
- Response: overspeed event

### GET /events/overspeed/:id/playback
- Response: telemetry playback points between the overspeed event start and end time

### GET /events/idling
- Query params (optional): `vehicleId`, `minDuration`, `startDate`, `endDate`
- Response: list of idling events

### GET /events/idling/:id
- Response: idling event

### GET /events/idling/:id/playback
- Response: playback points (currently returns empty array)

### GET /events/stop
- Query params (optional): `vehicleId`, `minDuration`, `startDate`, `endDate`
- Response: list of stop events

### GET /events/stop/:id
- Response: stop event

### GET /events/stop/:id/playback
- Response: telemetry playback points between the stop start and end time

---

## Routes

### GET /routes
- Response: list of routes

### GET /routes/:routeId
- Response: route

### POST /routes
- Body:
```json
{
  "name": "Route A",
  "startStop": { "id": "<uuid>", "name": "Stop 1", "lat": 11.23, "lon": 75.78 },
  "endStop": { "id": "<uuid>", "name": "Stop 2", "lat": 11.25, "lon": 75.80 },
  "intermediateStops": [],
  "assignedVehicleId": "<uuid>",
  "assignedVehicleName": "College Bus 1"
}
```
- Response:
```json
{ "success": true, "message": "Route created", "route": { "id": "<uuid>" } }
```

### PATCH /routes/:routeId
- Body: any of `name`, `startStop`, `endStop`, `intermediateStops`, `assignedVehicleId`, `assignedVehicleName`
- Response:
```json
{ "success": true, "message": "Route updated", "route": { "id": "<uuid>" } }
```

### DELETE /routes/:routeId
- Response:
```json
{ "success": true, "message": "Route deleted" }
```

---

## Geofences + Stops

### GET /geofences
- Response: list of geofences

### GET /geofences/:geofenceId
- Response: geofence

### POST /geofences
- Body:
```json
{ "name": "Main Gate", "address": "Campus Entrance", "lat": 11.25, "lon": 75.78, "radius": 200, "isStop": true }
```
- Response:
```json
{ "success": true, "message": "Geofence created", "geofence": { "id": "<uuid>" } }
```

### PUT /geofences/:geofenceId
- Body: any of `name`, `address`, `lat`, `lon`, `radius`, `isStop`
- Response:
```json
{ "success": true, "message": "Geofence updated", "geofence": { "id": "<uuid>" } }
```

### DELETE /geofences/:geofenceId
- Response:
```json
{ "success": true, "message": "Geofence deleted" }
```

### GET /geofences/stops
- Response: list of geofences with `isStop = true`

### GET /stop-events
- Query params: `fromDate` and `toDate` are required; optional `vehicleId`, `minDuration`, `maxDuration`
- Response: stop events derived from telemetry ignition transitions

---

## History

### GET /history
- Response: vehicle history summaries

### GET /history/:vehicleId
- Response: single vehicle history

### GET /history/:vehicleId/timeline
- Response: list of history points

---

## Notifications

### GET /notifications
- Response: list of notifications

### POST /notifications
- Body:
```json
{
  "type": "overspeed",
  "vehicleId": "<uuid>",
  "vehicleName": "College Bus 1",
  "message": "Overspeed detected",
  "location": "Campus Road",
  "timestamp": "2026-03-10T10:00:00Z"
}
```
- Response: notification record

### PATCH /notifications/:id/read
- Response:
```json
{ "success": true }
```

### PATCH /notifications/read-all
- Response:
```json
{ "success": true }
```

---

## Profile

### GET /profile
- Response: current authenticated profile

### GET /profile/preferences
- Response:
```json
{
  "timezone": "Asia/Kolkata",
  "preferences": {
    "overspeed": true,
    "idling": true,
    "geofence": true,
    "stop": true,
    "deviceOffline": true
  }
}
```

### PATCH /profile/preferences
- Body:
```json
{
  "timezone": "Asia/Kolkata",
  "preferences": {
    "overspeed": true,
    "idling": true,
    "geofence": true,
    "stop": true,
    "deviceOffline": true
  }
}
```
- Response:
```json
{ "success": true, "message": "Preferences updated", "preferences": { "timezone": "Asia/Kolkata", "preferences": { "overspeed": true, "idling": true, "geofence": true, "stop": true, "deviceOffline": true } } }
```

### PATCH /profile
- Body:
```json
{ "name": "New Name" }
```
- Response: updated profile

### POST /profile/change-password
- Response:
```json
{ "success": true }
```

---

## Users

### GET /users
- Response: list of users

### POST /users
- Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@vts.local",
  "password": "secret123",
  "role": "FLEET_MANAGER",
  "collegeId": "<uuid>"
}
```
- Response:
```json
{ "success": true, "user": { "id": "<uuid>" } }
```

### PATCH /users/:userId
- Body (any of):
```json
{ "name": "Jane", "role": "COLLEGE_ADMIN", "collegeId": "<uuid>", "status": "active" }
```
- Response:
```json
{ "success": true, "user": { "id": "<uuid>" } }
```

### PATCH /users/:userId/status
- Body:
```json
{ "status": "disabled" }
```
- Response:
```json
{ "success": true, "user": { "id": "<uuid>" } }
```

### DELETE /users/:userId
- Response:
```json
{ "success": true }
```
