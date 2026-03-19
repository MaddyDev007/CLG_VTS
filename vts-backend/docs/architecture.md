# Architecture

High‑level flow:

```
Device / Simulator -> MQTT (or HTTP /telemetry) -> Backend -> PostgreSQL -> Dashboard
                                         |-> WebSocket -> Dashboard
```

- Devices publish telemetry to MQTT or a simulator posts to `/telemetry`.
- Backend ingests, validates, and persists telemetry.
- Trip/event workflows can be orchestrated by Temporal (optional).
- WebSocket pushes live updates to dashboard.
