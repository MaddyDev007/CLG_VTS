# Installation Flow

This is the operational device installation sequence that firmware, backend, and field processes must align around.

## Pre-Installation

- create device record in backend
- record `deviceId` and `imei`
- confirm target college and vehicle assignment policy
- verify SIM and LTE provisioning
- set firmware deployment values in [config.h](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/include/config.h)
- ensure `DEVICE_ID` exactly matches the backend device record
- ensure `MQTT_BROKER` points to the same broker instance the backend subscribes to
- current old-backend stack uses Mosquitto on port `1883`

Broker rule:

- firmware must not use `localhost` unless the broker truly runs on the device itself
- if backend uses local Mosquitto on a laptop/server, firmware must use that host's reachable LAN/public IP or DNS name

## Physical Installation

Recommended steps:

1. mount device hardware securely
2. connect power safely
3. connect ignition sense wire
4. verify GNSS antenna placement
5. verify LTE signal path

## Ignition Wiring

Ignition wiring is critical because:

- trip start/end logic depends on ignition
- idling detection depends on ignition
- stop detection depends on ignition transitions

Rules:

- ignition must be read from a dedicated input
- firmware must not fake ignition-on forever
- field installers must validate ignition transitions before sign-off

Current firmware note:

- [config.h](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/include/config.h) defines `IGNITION_PIN`
- sample firmware in [main.cpp](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/src/main.cpp) uses `IGNITION_PIN` directly and only falls back when the pin is disabled
- sample firmware in [main.cpp](/home/user/Desktop/Maddy Git/CLG_VTS/Firmware/src/main.cpp) still does not provide production-grade durable queue persistence across reboot

## First-Time Activation

At first boot the device should:

1. initialize modem/GNSS
2. log deployment config and verify broker/device settings
3. obtain identity
4. publish identity message
5. validate broker connectivity
6. begin telemetry publish

## Verification Checklist

- device is visible in backend
- assigned vehicle is correct
- telemetry is arriving
- geofence labels resolve
- vehicle state updates correctly
- ignition changes affect trip/event logic
