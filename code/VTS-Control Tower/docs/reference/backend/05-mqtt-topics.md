# MQTT Integration

## Broker
- URL: from `MQTT_BROKER_URL`
- Default (local): `mqtt://localhost:1883`

> Note: The repo-level Docker Compose file starts Mosquitto for the shared stack. Local npm-only workflows should start Mosquitto with `docker compose up -d mosquitto` or point `MQTT_BROKER_URL` at another reachable broker.

## Topics
- Backend subscribe: `vts/devices/+/telemetry`
- Firmware/simulator publish: `vts/devices/{imei}/telemetry` for the current backend lookup path
- Firmware identity: `vts/devices/{imei}/identity`
- Firmware command subscribe: `vts/devices/{imei}/commands`
- Firmware ACK publish: `vts/devices/{imei}/ack`

## Payload format
Example payload accepted by `TelemetryHandler`:
```json
{
  "imei_no": "867451234567890",
  "timestamp": "2026-03-10T10:00:00Z",
  "lat": 11.2588,
  "lon": 75.7804,
  "speed_kmph": 45,
  "heading": 120,
  "battery_mv": 4100,
  "signal_dbm": -75,
  "ignition": true
}
```
`ignition` is optional; if missing, the backend assumes `true`.

## Processing flow
1. MQTT subscriber receives message.
2. Payload validation (numeric fields).
3. Device lookup via the telemetry topic segment as IMEI. The simulator also includes `imei_no`.
4. Device mapped to `assignedVehicleId`.
5. Telemetry stored in PostgreSQL.
6. Trips + events detected.
7. WebSocket emits `vehicle-update`.

## How to publish telemetry

### Using `mosquitto_pub` (local host)
```bash
mosquitto_pub -h localhost -p 1883 -t "vts/devices/867451234567890/telemetry" -m '{
  "imei_no":"867451234567890",
  "timestamp":"2026-03-10T10:00:00Z",
  "lat":11.2588,
  "lon":75.7804,
  "speed_kmph":45,
  "heading":120,
  "battery_mv":4100,
  "signal_dbm":-75,
  "ignition":true
}'
```

### Using MQTT.js (Node.js)
```ts
import mqtt from 'mqtt'

const client = mqtt.connect('mqtt://localhost:1883')
client.on('connect', () => {
  client.publish('vts/devices/867451234567890/telemetry', JSON.stringify({
    imei_no: '867451234567890',
    timestamp: new Date().toISOString(),
    lat: 11.2588,
    lon: 75.7804,
    speed_kmph: 45,
    heading: 120,
    battery_mv: 4100,
    signal_dbm: -75,
    ignition: true,
  }))
})
```

### Using the device simulator
From repo root:
```bash
cd code/vts-device-simulator
npm install
npm run server
```
Environment overrides:
- `MQTT_BROKER_URL` (default: `mqtt://mosquitto:1883`)
- `POSTGRES_URL`
- `BACKEND_API_URL`
- `SIMULATOR_SERVER_PORT` (default: `3011`)
- `SIM_PROTOCOL` (default: `mqtt`)

### Notes
- Topic format: `vts/devices/<imei>/telemetry`
- `imei_no` should match the topic `<imei>` when present.
- `ignition` is optional; if omitted, the backend assumes `true`.

## Two-way firmware testing

The current backend can publish interval commands through `POST /devices/:imei/interval` and waits for a matching ACK. Manual MQTT publish is still useful for isolating firmware or broker behavior.

Subscribe to ACKs:

```bash
mosquitto_sub -h localhost -p 1883 -t "vts/devices/867451234567890/ack" -v
```

Send a config update:

```bash
mosquitto_pub -h localhost -p 1883 -t "vts/devices/867451234567890/commands" -m '{
  "type":"config_update",
  "interval":10000
}'
```

Expected result:

- firmware logs the incoming `+QMTRECV`
- firmware prints `Telemetry interval updated to 10000 ms`
- firmware publishes `{"type":"ack","status":"success","interval":10000}` to `vts/devices/867451234567890/ack`
- next telemetry publishes follow the new interval
