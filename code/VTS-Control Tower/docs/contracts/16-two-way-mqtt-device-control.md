# Two-Way MQTT Device Control

## Purpose

This document describes the current two-way MQTT flow between backend-side tools and firmware running on ESP32 with the EC25 modem.

## Current Scope

Implemented today:

- device publishes telemetry
- device publishes identity on connect
- device subscribes for commands
- device applies runtime telemetry interval updates
- device publishes ACK after successful config update

Not implemented yet:

- backend API endpoint for command publishing
- frontend control screen for live device configuration
- persistent command audit/history in backend

## Broker Requirement

Telemetry, identity, commands, and ACKs must all use the same MQTT broker instance during a test run.

Examples:

- backend inside Docker may connect to `mqtt://mosquitto:1883`
- firmware must use the host LAN/public IP or domain for that same broker
- manual test tools such as `mosquitto_pub` and `mosquitto_sub` must also target that same broker

If these clients point at different brokers, telemetry may work in one place while commands appear to fail.

## Topics

- Telemetry: `vts/devices/{deviceId}/telemetry`
- Identity: `vts/devices/{deviceId}/identity`
- Commands: `vts/devices/{deviceId}/commands`
- ACK: `vts/devices/{deviceId}/ack`

Example for `deviceId = VTU_001`:

- `vts/devices/VTU_001/telemetry`
- `vts/devices/VTU_001/identity`
- `vts/devices/VTU_001/commands`
- `vts/devices/VTU_001/ack`

## Command Payload

Current supported command:

```json
{
  "type": "config_update",
  "interval": 10000
}
```

Rules:

- `type` must be `config_update`
- `interval` is milliseconds
- accepted range is `1000` to `60000`
- invalid payloads are ignored safely

## ACK Payload

On success, firmware publishes:

```json
{
  "type": "ack",
  "status": "success",
  "interval": 10000
}
```

## How To Test

### 1. Confirm firmware broker config

Check [config.h](/home/user/Desktop/Maddy%20Git/CLG_VTS/Firmware/include/config.h):

- `MQTT_BROKER`
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `DEVICE_ID`

Important:

- `MQTT_BROKER` must be the reachable host/IP of the same broker used by the backend
- do not use `localhost` on firmware unless the broker is physically running on the ESP32 device, which it is not in this setup

### 2. Observe ACK topic

From a machine that can reach the broker:

```bash
mosquitto_sub -h <broker-host> -p 1883 -t "vts/devices/VTU_001/ack" -v
```

Replace `VTU_001` with the actual firmware `DEVICE_ID`.

### 3. Send control command

```bash
mosquitto_pub -h <broker-host> -p 1883 -t "vts/devices/VTU_001/commands" -m '{
  "type":"config_update",
  "interval":10000
}'
```

### 4. Verify on serial logs

Expected firmware logs:

- `AT+QMTSUB response:`
- `+QMTSUB: 0,1,0`
- `Subscribed to command topic: vts/devices/VTU_001/commands`
- `Incoming modem output:`
- `MQTT command payload: {"type":"config_update","interval":10000}`
- `Telemetry interval updated to 10000 ms`
- `Publishing ACK topic: vts/devices/VTU_001/ack`

### 5. Verify behavior change

Before the command, telemetry should be sent about every `5000 ms`.

After sending the command with `interval = 10000`, telemetry should be sent about every `10000 ms`.

Because firmware now uses `millis()` scheduling instead of `delay(gps_poll_interval_ms)`, the new interval takes effect without reflashing.

## Negative Tests

These should not crash the firmware:

Invalid type:

```json
{
  "type": "unknown",
  "interval": 5000
}
```

Interval too low:

```json
{
  "type": "config_update",
  "interval": 500
}
```

Interval too high:

```json
{
  "type": "config_update",
  "interval": 120000
}
```

Malformed JSON:

```json
{"type":"config_update","interval":
```

Expected behavior:

- firmware logs an error or ignore message
- firmware keeps running
- firmware does not apply the invalid change
- firmware does not publish a success ACK

## What Changed In Code

Firmware-only changes were made in [main.cpp](/home/user/Desktop/Maddy%20Git/CLG_VTS/Firmware/src/main.cpp).

No backend code or frontend code was changed for this first two-way communication step.

That means:

- backend telemetry ingestion continues to work as before
- frontend dashboards continue to work as before
- command sending must currently be done by manual MQTT publish or a future backend feature

## Practical Conclusion

For your current testing, yes: you mainly need to send JSON to the command topic on the same MQTT server used by telemetry publish.

Use:

- broker: same broker as firmware publish and backend subscribe
- topic: `vts/devices/{deviceId}/commands`
- payload: `{"type":"config_update","interval":10000}`

Then verify:

- serial log shows the command was received
- ACK arrives on `vts/devices/{deviceId}/ack`
- telemetry cadence changes
