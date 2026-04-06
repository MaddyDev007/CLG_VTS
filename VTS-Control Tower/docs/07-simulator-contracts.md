# Simulator Contracts

## Purpose

Simulators exist to validate backend ingestion and frontend rendering without real hardware.

There are currently two simulator paths:

- `vts-device-simulator/`: DB-backed MQTT publisher for assigned devices
- `simulator/`: UI-driven publisher with manual driving controls and a local publish bridge

## Core Rule

Simulators must mimic firmware contracts as closely as possible.

They must not become an alternate protocol definition.

## Required Simulation Capabilities

Simulators must be able to model:

- intermittent connectivity
- delayed publishing
- queue flush after reconnect
- batching where firmware would batch
- signal degradation
- ignition on/off transitions
- stationary, idling, moving, and route-following behavior

## What Simulators Must Not Do

- send unrealistically perfect, always-connected telemetry
- skip identity flow if firmware requires it
- bypass backend ingestion by writing derived data directly
- emit a different JSON schema from firmware

## Current-State Notes

Current `vts-device-simulator`:

- loads assigned devices from DB
- publishes to `vts/devices/{deviceId}/telemetry`
- should use the same old-backend Mosquitto broker as backend/firmware when running the shared test flow
- should publish the same legacy payload fields the old backend expects: `device_id`, `timestamp`, `lat`, `lon`, `speed_kmph`, `battery_mv`, `signal_dbm`, `ignition`
- supports `random` and `route` motion
- does not currently simulate queueing, delays, or signal-loss behavior

Current `simulator/` UI app:

- manually publishes telemetry through a local HTTP bridge that connects to the shared MQTT broker
- uses a game-style control surface
- loads selectable devices from the DB-backed bridge source rather than from UI placeholders
- must not show a fake publish topic before a real device is selected
- does not currently model offline buffering

Broker rule:

- simulators must publish to the same broker instance the backend subscribes to
- for the current old stack, the backend uses `mqtt://mosquitto:1883` internally and local host-based tools typically use `mqtt://localhost:1883`
- `localhost` is valid only for the simulator's HTTP bridge address, not as the MQTT broker for remote/shared testing

These gaps should be closed by evolving simulators toward firmware parity.
