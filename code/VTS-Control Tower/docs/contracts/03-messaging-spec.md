# Messaging Specification

This document defines the canonical transport contract between device-side senders and the backend ingestion layer.

## Transport

Current transport:

- MQTT
- current old-backend stack broker: Mosquitto on port `1883`
- backend container connects internally as `mqtt://mosquitto:1883`
- external publishers such as firmware must target the host machine LAN/public IP or domain on port `1883`
- all publishers and subscribers must target the same broker instance during a test run

Current backend subscription:

- `vts/devices/+/telemetry`

Recommended topic layout:

- telemetry publish: `vts/devices/{deviceId}/telemetry`
- identity publish: `vts/devices/{deviceId}/identity`
- command downlink: `vts/devices/{deviceId}/commands`
- command ack: `vts/devices/{deviceId}/ack`

## Device -> Server Telemetry Message

Preferred future contract:

```json
{
  "deviceId": "string",
  "timestamp": 1710000000000,
  "lat": 8.7139,
  "lng": 77.7567,
  "speed": 32.4,
  "ignition": true,
  "battery": 3900,
  "signal": -70
}
```

Field rules for the future contract:

- `deviceId`: logical device UID
- `timestamp`: epoch milliseconds only
- `lat`, `lng`: decimal degrees
- `speed`: km/h
- `ignition`: boolean
- `battery`: mV or normalized unit, but must be documented consistently
- `signal`: RSSI-like numeric signal strength

## Current Old-Backend Contract

The old backend currently ingests this legacy shape and new compatibility work must publish this shape:

```json
{
  "device_id": "BUS_001",
  "timestamp": "2026-03-23T12:00:00.000Z",
  "lat": 8.7139,
  "lon": 77.7567,
  "speed_kmph": 35,
  "heading": 90,
  "battery_mv": 3900,
  "signal_dbm": -70,
  "ignition": true
}
```

Current backend supports this legacy shape as a temporary compatibility path. New work must prefer the canonical shape above.

Current-state note:

- the sample firmware in `Firmware/src/main.cpp` is configured to publish the old-backend-compatible payload
- the current old-backend stack uses the same MQTT topic on Mosquitto
- the sample firmware now validates MQTT acknowledgements and queues failed telemetry in bounded memory for retry
- legacy field names are the active compatibility contract for this workspace until the old backend is upgraded end-to-end

## Identity Message

Required canonical identity message:

```json
{
  "type": "identity",
  "deviceId": "string",
  "imsi": "string",
  "firmwareVersion": "string"
}
```

Rules:

- sent at boot and after reconnect
- resent on firmware version change
- persisted by backend if identity tracking is added

Current-state note:

- the sample firmware now publishes an identity message on MQTT connect
- the old backend currently ignores identity messages, so they are optional for compatibility

## Server -> Device Command Message

Current implemented contract for firmware interval updates:

```json
{
  "type": "config_update",
  "interval": 10000
}
```

Rules:

- publish to `vts/devices/{deviceId}/commands`
- `interval` is in milliseconds
- firmware accepts values from `1000` to `60000`
- malformed or unsupported payloads must be ignored safely
- firmware logs the modem response and the received payload for debugging

Current ACK contract:

```json
{
  "type": "ack",
  "status": "success",
  "interval": 10000
}
```

ACK rules:

- firmware publishes ACK to `vts/devices/{deviceId}/ack`
- ACK is emitted only after a valid config update is applied
- ACK uses the same MQTT broker instance as telemetry and identity

Future extensibility:

- additional command types such as reboot or request-identity can be added later
- new command types should keep the same topic and include a stable `type` field

## Retry, Queue, Offline Rules

Firmware and simulators must implement:

- store-and-forward queue
- bounded offline persistence
- retry with backoff
- message ordering by `timestamp`

Rules:

- if MQTT is unavailable, queue messages locally
- do not drop the newest telemetry first; evict oldest when queue cap is exceeded
- preserve the original telemetry timestamp
- publish queue contents before sending newest live messages when reconnecting
- changing the broker host is a deployment/configuration choice only; it must not change topics or payloads

Recommended defaults:

- send interval configurable, default 5s
- offline queue capacity: at least 500 messages
- retry backoff: 1s -> 2s -> 5s -> 10s capped
- MQTT QoS: at least configurable; current simulators use QoS 0

## Backend Behavior

Backend must:

- accept only valid telemetry schema
- reject malformed payloads
- resolve the device from the payload or topic
- never assume device assignment exists
- never create duplicate stop persistence paths
