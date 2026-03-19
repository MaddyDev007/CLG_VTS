# Architecture Diagrams

## System Flow
```
Devices / Simulator
  |
  | (MQTT or HTTP)
  v
NestJS Backend
  |
  +--> PostgreSQL (storage)
  |
  +--> WebSocket (Socket.IO)
  |
  v
Dashboard (REST + WS)
```

## Backend Internals
```
MQTT -> TelemetryHandler
          |-> TelemetryService -> DB
          |-> TripsService (trip detection)
          |-> EventsService -> NotificationsService
          |-> TelemetryGateway (vehicle-update)

REST Controllers -> Services -> Repositories -> DB
```
