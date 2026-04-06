# API Contract (JSON)

```json
{
  "meta": {
    "name": "VTS Frontend API Contract",
    "baseUrlEnv": "VITE_API_BASE_URL",
    "wsUrlEnv": "VITE_WS_URL",
    "contentType": "application/json",
    "auth": {
      "type": "bearer",
      "header": "Authorization",
      "format": "Bearer <token>",
      "required": true
    }
  },
  "endpoints": [
    {
      "id": "auth.login",
      "method": "POST",
      "path": "/auth/login",
      "requiredByUI": true,
      "request": { "email": "string", "password": "string" },
      "response": { "token": "string", "role": "SUPER_ADMIN|COLLEGE_ADMIN|FLEET_MANAGER|STUDENT", "name": "string" }
    },
    {
      "id": "auth.logout",
      "method": "POST",
      "path": "/auth/logout",
      "requiredByUI": true,
      "request": {},
      "response": { "success": true }
    },

    {
      "id": "vehicles.list",
      "method": "GET",
      "path": "/vehicles",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "registrationNumber": "string",
          "vehicleName": "string",
          "vehicleType": "Bus|Car|Van|Truck",
          "status": "moving|idling|offline|maintenance",
          "deviceId": "string|unassigned",
          "speed": "number",
          "lat": "number",
          "lon": "number",
          "address": "string",
          "lastSeen": "ISO-8601"
        }
      ]
    },
    {
      "id": "vehicles.get",
      "method": "GET",
      "path": "/vehicles/:vehicleId",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "registrationNumber": "string",
        "vehicleName": "string",
        "vehicleType": "Bus|Car|Van|Truck",
        "status": "moving|idling|offline|maintenance",
        "deviceId": "string|unassigned",
        "speed": "number",
        "lat": "number",
        "lon": "number",
        "address": "string",
        "lastSeen": "ISO-8601"
      }
    },
    {
      "id": "vehicles.trips",
      "method": "GET",
      "path": "/vehicles/:vehicleId/trips",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "startTime": "ISO-8601",
          "endTime": "ISO-8601",
          "distance": "number",
          "maxSpeed": "number"
        }
      ]
    },
    {
      "id": "vehicles.telemetry",
      "method": "GET",
      "path": "/vehicles/:vehicleId/telemetry",
      "requiredByUI": true,
      "response": [
        {
          "timestamp": "ISO-8601",
          "lat": "number",
          "lon": "number",
          "speed": "number",
          "ignition": "boolean"
        }
      ]
    },
    {
      "id": "vehicles.statusCounts",
      "method": "GET",
      "path": "/vehicles/status-counts",
      "requiredByUI": true,
      "response": { "total": 0, "moving": 0, "idling": 0, "offline": 0, "maintenance": 0, "stopped": "derived" }
    },
    {
      "id": "vehicles.create",
      "method": "POST",
      "path": "/vehicles",
      "requiredByUI": true,
      "request": {
        "vehicleName": "string",
        "vehicleType": "Bus|Car|Van|Truck",
        "deviceId": "string|optional",
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601"
      },
      "response": {
        "success": true,
        "message": "string",
        "vehicle": { "id": "string" }
      }
    },
    {
      "id": "vehicles.update",
      "method": "PUT",
      "path": "/vehicles/:vehicleId",
      "requiredByUI": true,
      "request": {
        "vehicleName": "string",
        "vehicleType": "Bus|Car|Van|Truck",
        "deviceId": "string|optional",
        "updatedAt": "ISO-8601"
      },
      "response": {
        "success": true,
        "message": "string",
        "vehicle": { "id": "string" }
      }
    },
    {
      "id": "vehicles.delete",
      "method": "DELETE",
      "path": "/vehicles/:vehicleId",
      "requiredByUI": true,
      "response": { "success": true, "message": "string" }
    },

    {
      "id": "devices.list",
      "method": "GET",
      "path": "/devices",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "deviceId": "string",
          "imei": "string",
          "assignedVehicleId": "string|optional",
          "assignedVehicleName": "string|optional",
          "status": "assigned|unassigned",
          "createdAt": "ISO-8601",
          "updatedAt": "ISO-8601"
        }
      ]
    },
    {
      "id": "devices.getByUid",
      "method": "GET",
      "path": "/devices/by-uid/:deviceUid",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "deviceId": "string",
        "imei": "string",
        "assignedVehicleId": "string|optional",
        "assignedVehicleName": "string|optional",
        "status": "assigned|unassigned",
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601"
      }
    },
    {
      "id": "devices.unassigned",
      "method": "GET",
      "path": "/devices/unassigned",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "deviceId": "string",
          "imei": "string",
          "status": "unassigned"
        }
      ]
    },
    {
      "id": "devices.create",
      "method": "POST",
      "path": "/devices",
      "requiredByUI": true,
      "request": { "deviceId": "string", "imei": "string" },
      "response": { "success": true, "message": "string", "device": { "id": "string" } }
    },
    {
      "id": "devices.update",
      "method": "PUT",
      "path": "/devices/:deviceId",
      "requiredByUI": true,
      "request": { "deviceId": "string", "imei": "string" },
      "response": { "success": true, "message": "string", "device": { "id": "string" } }
    },
    {
      "id": "devices.delete",
      "method": "DELETE",
      "path": "/devices/:deviceId",
      "requiredByUI": true,
      "response": { "success": true, "message": "string" }
    },
    {
      "id": "devices.assign",
      "method": "POST",
      "path": "/devices/:deviceUid/assign",
      "requiredByUI": true,
      "request": { "vehicleId": "string", "vehicleName": "string" },
      "response": { "success": true }
    },
    {
      "id": "devices.unassign",
      "method": "POST",
      "path": "/devices/:deviceUid/unassign",
      "requiredByUI": true,
      "request": {},
      "response": { "success": true }
    },

    {
      "id": "routes.list",
      "method": "GET",
      "path": "/routes",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "name": "string",
          "startStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
          "endStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
          "intermediateStops": [{ "id": "string", "name": "string", "lat": "number", "lon": "number" }],
          "assignedVehicleId": "string|optional",
          "assignedVehicleName": "string|optional",
          "stopsCount": "number",
          "status": "active|idle",
          "createdAt": "ISO-8601"
        }
      ]
    },
    {
      "id": "routes.get",
      "method": "GET",
      "path": "/routes/:routeId",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "name": "string",
        "startStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
        "endStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
        "intermediateStops": [{ "id": "string", "name": "string", "lat": "number", "lon": "number" }],
        "assignedVehicleId": "string|optional",
        "assignedVehicleName": "string|optional",
        "stopsCount": "number",
        "status": "active|idle",
        "createdAt": "ISO-8601"
      }
    },
    {
      "id": "routes.create",
      "method": "POST",
      "path": "/routes",
      "requiredByUI": true,
      "request": {
        "name": "string",
        "startStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
        "endStop": { "id": "string", "name": "string", "lat": "number", "lon": "number" },
        "intermediateStops": [{ "id": "string", "name": "string", "lat": "number", "lon": "number" }],
        "assignedVehicleId": "string|optional",
        "assignedVehicleName": "string|optional"
      },
      "response": { "success": true, "message": "string", "route": { "id": "string" } }
    },
    {
      "id": "routes.update",
      "method": "PATCH",
      "path": "/routes/:routeId",
      "requiredByUI": true,
      "request": {
        "name": "string|optional",
        "startStop": "RouteStop|optional",
        "endStop": "RouteStop|optional",
        "intermediateStops": "RouteStop[]|optional",
        "assignedVehicleId": "string|optional",
        "assignedVehicleName": "string|optional"
      },
      "response": { "success": true, "message": "string", "route": { "id": "string" } }
    },
    {
      "id": "routes.delete",
      "method": "DELETE",
      "path": "/routes/:routeId",
      "requiredByUI": true,
      "response": { "success": true, "message": "string" }
    },

    {
      "id": "geofences.list",
      "method": "GET",
      "path": "/geofences",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "name": "string",
          "address": "string",
          "lat": "number",
          "lon": "number",
          "radius": "number",
          "isStop": "boolean",
          "createdAt": "ISO-8601",
          "updatedAt": "ISO-8601"
        }
      ]
    },
    {
      "id": "geofences.create",
      "method": "POST",
      "path": "/geofences",
      "requiredByUI": true,
      "request": {
        "name": "string",
        "address": "string",
        "lat": "number",
        "lon": "number",
        "radius": "number",
        "isStop": "boolean"
      },
      "response": { "success": true, "message": "string", "geofence": { "id": "string" } }
    },
    {
      "id": "geofences.update",
      "method": "PUT",
      "path": "/geofences/:geofenceId",
      "requiredByUI": true,
      "request": {
        "name": "string|optional",
        "address": "string|optional",
        "lat": "number|optional",
        "lon": "number|optional",
        "radius": "number|optional",
        "isStop": "boolean|optional"
      },
      "response": { "success": true, "message": "string", "geofence": { "id": "string" } }
    },
    {
      "id": "geofences.delete",
      "method": "DELETE",
      "path": "/geofences/:geofenceId",
      "requiredByUI": true,
      "response": { "success": true, "message": "string" }
    },
    {
      "id": "stops.list",
      "method": "GET",
      "path": "/stops?isStop=true",
      "requiredByUI": true,
      "response": [{ "id": "string", "name": "string", "lat": "number", "lon": "number" }]
    },

    {
      "id": "trips.list",
      "method": "GET",
      "path": "/trips",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "vehicleName": "string",
          "startLocation": "string",
          "endLocation": "string",
          "startTime": "ISO-8601",
          "endTime": "ISO-8601",
          "duration": "number (ms)",
          "distance": "number"
        }
      ]
    },
    {
      "id": "trips.get",
      "method": "GET",
      "path": "/trips/:tripId",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "vehicleId": "string",
        "vehicleName": "string",
        "startLocation": "string",
        "endLocation": "string",
        "startTime": "ISO-8601",
        "endTime": "ISO-8601",
        "duration": "number (ms)",
        "distance": "number"
      }
    },
    {
      "id": "trips.playback",
      "method": "GET",
      "path": "/trips/:tripId/playback",
      "requiredByUI": true,
      "response": [{ "timestamp": "ISO-8601", "lat": "number", "lon": "number", "speed": "number" }]
    },

    {
      "id": "telemetry.list",
      "method": "GET",
      "path": "/telemetry",
      "requiredByUI": true,
      "query": {
        "vehicleId": "string|optional",
        "ignition": "boolean|optional",
        "startDate": "ISO-8601|optional",
        "endDate": "ISO-8601|optional"
      },
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "vehicleName": "string",
          "deviceId": "string",
          "timestamp": "ISO-8601",
          "lat": "number",
          "lon": "number",
          "address": "string",
          "speed": "number",
          "ignition": "boolean",
          "battery": "number",
          "signal": "number"
        }
      ]
    },

    {
      "id": "events.overspeed.list",
      "method": "GET",
      "path": "/events/overspeed",
      "requiredByUI": true,
      "query": {
        "vehicleId": "string|optional",
        "speedLimit": "number|optional",
        "startDate": "ISO-8601|optional",
        "endDate": "ISO-8601|optional"
      },
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "vehicleName": "string",
          "tripId": "string",
          "maxSpeed": "number",
          "speedLimit": "number",
          "duration": "number (ms)",
          "startTime": "ISO-8601",
          "endTime": "ISO-8601",
          "location": "string",
          "lat": "number",
          "lon": "number"
        }
      ]
    },
    {
      "id": "events.overspeed.get",
      "method": "GET",
      "path": "/events/overspeed/:id",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "vehicleId": "string",
        "vehicleName": "string",
        "tripId": "string",
        "maxSpeed": "number",
        "speedLimit": "number",
        "duration": "number (ms)",
        "startTime": "ISO-8601",
        "endTime": "ISO-8601",
        "location": "string",
        "lat": "number",
        "lon": "number"
      }
    },
    {
      "id": "events.overspeed.playback",
      "method": "GET",
      "path": "/events/overspeed/:id/playback",
      "requiredByUI": true,
      "response": [{ "timestamp": "ISO-8601", "lat": "number", "lon": "number", "speed": "number" }]
    },

    {
      "id": "events.idling.list",
      "method": "GET",
      "path": "/events/idling",
      "requiredByUI": true,
      "query": {
        "vehicleId": "string|optional",
        "minDuration": "number (ms)|optional",
        "startDate": "ISO-8601|optional",
        "endDate": "ISO-8601|optional"
      },
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "vehicleName": "string",
          "tripId": "string",
          "duration": "number (ms)",
          "startTime": "ISO-8601",
          "endTime": "ISO-8601",
          "location": "string",
          "lat": "number",
          "lon": "number"
        }
      ]
    },
    {
      "id": "events.idling.get",
      "method": "GET",
      "path": "/events/idling/:id",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "vehicleId": "string",
        "vehicleName": "string",
        "tripId": "string",
        "duration": "number (ms)",
        "startTime": "ISO-8601",
        "endTime": "ISO-8601",
        "location": "string",
        "lat": "number",
        "lon": "number"
      }
    },
    {
      "id": "events.idling.playback",
      "method": "GET",
      "path": "/events/idling/:id/playback",
      "requiredByUI": true,
      "response": [{ "timestamp": "ISO-8601", "lat": "number", "lon": "number", "speed": "number" }]
    },

    {
      "id": "events.stop.list",
      "method": "GET",
      "path": "/events/stop",
      "requiredByUI": true,
      "query": {
        "vehicleId": "string|optional",
        "minDuration": "number (ms)|optional",
        "startDate": "ISO-8601|optional",
        "endDate": "ISO-8601|optional"
      },
      "response": [
        {
          "id": "string",
          "vehicleId": "string",
          "vehicleName": "string",
          "tripId": "string",
          "duration": "number (ms)",
          "startTime": "ISO-8601",
          "endTime": "ISO-8601",
          "location": "string",
          "lat": "number",
          "lon": "number"
        }
      ]
    },
    {
      "id": "events.stop.get",
      "method": "GET",
      "path": "/events/stop/:id",
      "requiredByUI": true,
      "response": {
        "id": "string",
        "vehicleId": "string",
        "vehicleName": "string",
        "tripId": "string",
        "duration": "number (ms)",
        "startTime": "ISO-8601",
        "endTime": "ISO-8601",
        "location": "string",
        "lat": "number",
        "lon": "number"
      }
    },
    {
      "id": "events.stop.playback",
      "method": "GET",
      "path": "/events/stop/:id/playback",
      "requiredByUI": true,
      "response": [{ "timestamp": "ISO-8601", "lat": "number", "lon": "number", "speed": "number" }]
    },

    {
      "id": "history.list",
      "method": "GET",
      "path": "/history",
      "requiredByUI": true,
      "response": [
        {
          "vehicleId": "string",
          "vehicleName": "string",
          "lastLocation": "string",
          "lastSeen": "ISO-8601",
          "totalDistance": "number",
          "totalTrips": "number"
        }
      ]
    },
    {
      "id": "history.get",
      "method": "GET",
      "path": "/history/:vehicleId",
      "requiredByUI": true,
      "response": {
        "vehicleId": "string",
        "vehicleName": "string",
        "lastLocation": "string",
        "lastSeen": "ISO-8601",
        "totalDistance": "number",
        "totalTrips": "number"
      }
    },
    {
      "id": "history.timeline",
      "method": "GET",
      "path": "/history/:vehicleId/timeline",
      "requiredByUI": true,
      "response": [
        {
          "timestamp": "ISO-8601",
          "lat": "number",
          "lon": "number",
          "speed": "number",
          "ignition": "boolean",
          "address": "string"
        }
      ]
    },

    {
      "id": "notifications.list",
      "method": "GET",
      "path": "/notifications",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "type": "overspeed|geofence_enter|geofence_exit|idling|stop",
          "vehicleId": "string",
          "vehicleName": "string",
          "message": "string",
          "location": "string",
          "timestamp": "ISO-8601",
          "read": "boolean"
        }
      ]
    },
    {
      "id": "notifications.create",
      "method": "POST",
      "path": "/notifications",
      "requiredByUI": true,
      "request": {
        "type": "overspeed|geofence_enter|geofence_exit|idling|stop",
        "vehicleId": "string",
        "vehicleName": "string",
        "message": "string",
        "location": "string",
        "timestamp": "ISO-8601|optional"
      },
      "response": {
        "id": "string",
        "type": "string",
        "vehicleId": "string",
        "vehicleName": "string",
        "message": "string",
        "location": "string",
        "timestamp": "ISO-8601",
        "read": "boolean"
      }
    },
    {
      "id": "notifications.read",
      "method": "PATCH",
      "path": "/notifications/:id/read",
      "requiredByUI": true,
      "request": {},
      "response": { "success": true }
    },
    {
      "id": "notifications.readAll",
      "method": "PATCH",
      "path": "/notifications/read-all",
      "requiredByUI": true,
      "request": {},
      "response": { "success": true }
    },

    {
      "id": "profile.preferences.get",
      "method": "GET",
      "path": "/profile/preferences",
      "requiredByUI": true,
      "response": {
        "timezone": "string",
        "preferences": {
          "overspeed": "boolean",
          "idling": "boolean",
          "geofence": "boolean",
          "stop": "boolean",
          "deviceOffline": "boolean"
        }
      }
    },
    {
      "id": "profile.preferences.update",
      "method": "PATCH",
      "path": "/profile/preferences",
      "requiredByUI": true,
      "request": {
        "timezone": "string",
        "preferences": {
          "overspeed": "boolean",
          "idling": "boolean",
          "geofence": "boolean",
          "stop": "boolean",
          "deviceOffline": "boolean"
        }
      },
      "response": { "success": true, "message": "string" }
    },
    {
      "id": "profile.update",
      "method": "PATCH",
      "path": "/profile",
      "requiredByUI": false,
      "request": { "name": "string" },
      "response": { "success": true }
    },
    {
      "id": "profile.changePassword",
      "method": "POST",
      "path": "/profile/change-password",
      "requiredByUI": false,
      "request": { "currentPassword": "string", "newPassword": "string" },
      "response": { "success": true }
    },

    {
      "id": "users.list",
      "method": "GET",
      "path": "/users",
      "requiredByUI": true,
      "response": [
        {
          "id": "string",
          "name": "string",
          "email": "string",
          "role": "SUPER_ADMIN|COLLEGE_ADMIN|FLEET_MANAGER|STUDENT",
          "collegeId": "string|optional",
          "status": "active|disabled",
          "createdAt": "ISO-8601"
        }
      ]
    },
    {
      "id": "users.create",
      "method": "POST",
      "path": "/users",
      "requiredByUI": true,
      "request": {
        "name": "string",
        "email": "string",
        "password": "string",
        "role": "SUPER_ADMIN|COLLEGE_ADMIN|FLEET_MANAGER|STUDENT",
        "collegeId": "string|optional"
      },
      "response": { "success": true, "user": { "id": "string" } }
    },
    {
      "id": "users.update",
      "method": "PATCH",
      "path": "/users/:userId",
      "requiredByUI": true,
      "request": {
        "name": "string|optional",
        "role": "SUPER_ADMIN|COLLEGE_ADMIN|FLEET_MANAGER|STUDENT|optional",
        "collegeId": "string|optional",
        "status": "active|disabled|optional"
      },
      "response": { "success": true, "user": { "id": "string" } }
    },
    {
      "id": "users.disable",
      "method": "PATCH",
      "path": "/users/:userId/disable",
      "requiredByUI": true,
      "request": {},
      "response": { "success": true, "user": { "id": "string" } }
    },
    {
      "id": "users.delete",
      "method": "DELETE",
      "path": "/users/:userId",
      "requiredByUI": true,
      "response": { "success": true }
    },

    {
      "id": "external.osm.search",
      "method": "GET",
      "path": "https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5",
      "requiredByUI": true,
      "response": [{ "display_name": "string", "lat": "string", "lon": "string" }]
    },
    {
      "id": "external.osm.reverse",
      "method": "GET",
      "path": "https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json",
      "requiredByUI": true,
      "response": { "display_name": "string" }
    },
    {
      "id": "external.tiles.osm",
      "method": "GET",
      "path": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "requiredByUI": true,
      "response": "image/png"
    },
    {
      "id": "external.tiles.esri",
      "method": "GET",
      "path": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      "requiredByUI": true,
      "response": "image/jpeg"
    },

    {
      "id": "realtime.websocket",
      "method": "WS",
      "path": "VITE_WS_URL",
      "requiredByUI": false,
      "request": {},
      "response": {}
    }
  ]
}
```
