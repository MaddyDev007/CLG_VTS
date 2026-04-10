#pragma once

// Firmware deployment settings live here.
// This firmware is adapted to the old backend stack in this workspace.
// The old backend subscribes to the same MQTT broker instance used by firmware.
// When the old backend runs with Docker, it connects to the broker container as
// "mosquitto", but the ESP32 must use the host machine's reachable LAN/public
// IP or domain here. Do not use localhost unless the broker truly runs on the
// device itself and is reachable from firmware.

#ifndef EC25_TX
#define EC25_TX 27
#endif

#ifndef EC25_RX
#define EC25_RX 26
#endif

#ifndef UART_BAUD
#define UART_BAUD 115200
#endif

#ifndef IGNITION_PIN
#define IGNITION_PIN 33
#endif
// Set IGNITION_PIN to -1 to disable the hardware ignition input and use the
// firmware fallback state temporarily during bench testing.

#ifndef MQTT_BROKER
#define MQTT_BROKER "16.112.201.36"
#endif

#ifndef MQTT_PORT
#define MQTT_PORT 1883
#endif

#ifndef MQTT_USERNAME
#define MQTT_USERNAME ""
#endif

#ifndef MQTT_PASSWORD
#define MQTT_PASSWORD ""
#endif

#ifndef DEVICE_ID
#define DEVICE_ID "TEC_DEV_001"
#endif
// DEVICE_ID must match the old backend device record used for assigned-device flow.

#ifndef GNSS_FIX_TIMEOUT_MS
#define GNSS_FIX_TIMEOUT_MS 15000
#endif

#ifndef MQTT_ACK_TIMEOUT_MS
#define MQTT_ACK_TIMEOUT_MS 5000
#endif
