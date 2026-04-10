# MQTT Integration

## Broker
- URL: from `MQTT_BROKER_URL`
- Default (local): `mqtt://localhost:1883`

> Note: The Docker Compose file in this repo does not start Mosquitto. Run a broker locally or in a separate container if needed.

## Topics
- Backend subscribe: `vts/devices/+/telemetry`
- Firmware publish: `vts/devices/{deviceId}/telemetry`
- Firmware identity: `vts/devices/{deviceId}/identity`
- Firmware command subscribe: `vts/devices/{deviceId}/commands`
- Firmware ACK publish: `vts/devices/{deviceId}/ack`

## Payload format
Example payload accepted by `TelemetryHandler`:
```json
{
  "device_id": "VTU_001",
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
3. Device lookup via `device_id` (or topic segment).
4. Device mapped to `assignedVehicleId`.
5. Telemetry stored in PostgreSQL.
6. Trips + events detected.
7. WebSocket emits `vehicle-update`.

## How to publish telemetry

### Using `mosquitto_pub` (local host)
```bash
mosquitto_pub -h localhost -p 1883 -t "vts/devices/VTU_001/telemetry" -m '{
  "device_id":"VTU_001",
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
  client.publish('vts/devices/VTU_001/telemetry', JSON.stringify({
    device_id: 'VTU_001',
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
cd vts-device-simulator
npm install
node simulator.js
```
Environment overrides:
- `SIM_MQTT_URL` (default: `mqtt://localhost:1883`)
- `SIM_DEVICE_IDS` (default: `VTU_001,VTU_002,VTU_003`)
- `SIM_INTERVAL_MS` (default: `5000`)
- `SIM_BASE_LAT`, `SIM_BASE_LON`

### Notes
- Topic format: `vts/devices/<deviceId>/telemetry`
- `device_id` should match the topic `<deviceId>`.
- `ignition` is optional; if omitted, the backend assumes `true`.

## Two-way firmware testing

The current backend consumes telemetry from MQTT but does not yet publish control commands on its own. To test device downlink, publish a command manually to the same broker instance the firmware uses.

Subscribe to ACKs:

```bash
mosquitto_sub -h localhost -p 1883 -t "vts/devices/VTU_001/ack" -v
```

Send a config update:

```bash
mosquitto_pub -h localhost -p 1883 -t "vts/devices/VTU_001/commands" -m '{
  "type":"config_update",
  "interval":10000
}'
```

Expected result:

- firmware logs the incoming `+QMTRECV`
- firmware prints `Telemetry interval updated to 10000 ms`
- firmware publishes `{"type":"ack","status":"success","interval":10000}` to `vts/devices/VTU_001/ack`
- next telemetry publishes follow the new interval
