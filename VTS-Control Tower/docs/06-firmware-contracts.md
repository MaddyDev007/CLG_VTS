# Firmware Contracts

## Purpose

Firmware runs on the installed device and is responsible for telemetry production and reliable delivery under unstable network conditions.

## Required Behaviors

Firmware must:

- acquire GNSS data
- read ignition state
- know its `deviceId`
- send telemetry at a configurable interval
- send identity on boot/reconnect
- queue data when offline
- retry publishing when connectivity returns

## Required Identity Message

Firmware must publish:

```json
{
  "type": "identity",
  "deviceId": "string",
  "imsi": "string",
  "firmwareVersion": "string"
}
```

## Required Telemetry Behavior

- preserve original sample timestamp
- do not overwrite queued timestamps with reconnect time
- keep message ordering
- continue operating during temporary LTE loss

## Store-And-Forward

Must implement:

- persistent or durable in-memory queue
- bounded queue size
- oldest-first flush order

Must not:

- assume constant connectivity
- block telemetry collection while publish is failing
- silently discard all offline samples

## Configurability

Must support:

- send interval
- broker URL/port
- credentials if used
- debug level

Firmware deployment config lives in [config.h](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/include/config.h), which is the source of truth for:

- `DEVICE_ID`
- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `EC25_RX`
- `EC25_TX`
- `IGNITION_PIN`

Broker requirement:

- firmware must connect to the same MQTT broker instance the backend subscribes to
- current old-backend stack broker is Mosquitto on port `1883`
- if the backend runs in Docker, the backend uses `mqtt://mosquitto:1883` internally but firmware must use the host machine LAN/public IP or domain
- `localhost` is not a valid firmware broker unless the broker truly runs on the device itself
- if backend uses Mosquitto on another machine, firmware must use that machine's reachable LAN/public IP or domain

Identity requirement:

- firmware `DEVICE_ID` must match the backend device record used for assigned-device flow

## Current-State Notes

Current sample firmware in [Firmware/src/main.cpp](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/src/main.cpp):

- consumes deployment settings from [config.h](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/include/config.h) instead of redefining broker/device/pin defaults in code
- validates MQTT open, connect, and publish acknowledgements before reporting success
- retries MQTT connection with bounded reconnect backoff
- publishes directly to MQTT
- publishes old-backend-compatible telemetry to `vts/devices/{deviceId}/telemetry`
- emits the old backend payload fields: `device_id`, `timestamp`, `lat`, `lon`, `speed_kmph`, `ignition`, `battery_mv`, `signal_dbm`
- publishes identity on MQTT connect to `vts/devices/{deviceId}/identity`
- keeps a bounded in-memory oldest-first queue when telemetry publish fails
- logs broker, port, client id, and MQTT topics at boot/connect time
- fails loudly when `MQTT_BROKER` is blank, placeholder, or loopback-only
- derives ISO timestamps from GNSS date/time when available so the old backend accepts them directly
- omits the `timestamp` field when GNSS date/time is not parseable so the old backend can fall back to server time
- uses `IGNITION_PIN` from config and only falls back when that pin is explicitly disabled
- does not yet provide durable store-and-forward persistence across device reboot
- still uses best-effort modem parsing for IMSI, signal, and battery values

This sample should be treated as a prototype, not as the final contract implementation.
