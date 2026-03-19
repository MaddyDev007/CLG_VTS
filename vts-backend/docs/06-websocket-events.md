# WebSocket Events

## Endpoint
- Namespace: `/telemetry`
- URL: `ws://<host>:3000/telemetry`

## Events
### vehicle-update
Emitted on every telemetry ingest.

Payload:
```json
{
  "vehicleId": "uuid",
  "lat": 11.2588,
  "lon": 75.7804,
  "speed": 45,
  "status": "moving"
}
```

## Frontend subscription
The frontend connects using `VITE_WS_URL` and listens for `vehicle-update`.
