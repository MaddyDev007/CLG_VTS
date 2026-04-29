# Simulator Contracts

## Purpose

Simulators exist to validate backend ingestion and frontend rendering without real hardware.

There is currently one active simulator path:

- `vts-device-simulator/`: UI-driven simulator that loads assigned devices from DB and publishes directly to MQTT, TCP, or UDP

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
- publishes to `vts/devices/{imei}/telemetry` in the current UI flow
- should use the same broker instance as backend/firmware when running the shared test flow
- publishes `imei_no`, `timestamp`, `lat`, `lon`, `speed_kmph`, `heading`, `battery_mv`, `signal_dbm`, and `ignition`
- normalizes `imei_no` from the selected assigned device before publishing
- supports direct publish over MQTT, TCP, and UDP
- supports local driving controls through the UI
- does not currently simulate queueing, delays, or signal-loss behavior

Broker rule:

- simulators must publish to the same broker instance the backend subscribes to
- for local host testing, the simulator can use `mqtt://localhost:1883`
- for Docker Compose, the simulator uses `mqtt://mosquitto:1883` internally
- for remote/shared testing such as AWS, all containers should still point to the same broker instance for that deployment

These gaps should be closed by evolving simulators toward firmware parity.
