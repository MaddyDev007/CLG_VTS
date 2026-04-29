# QR Onboarding

## Purpose

QR onboarding provides a simple bridge between physical hardware and backend identity.

## Canonical QR Payload

```json
{
  "deviceId": "string",
  "imsi": "string"
}
```

## Usage

Recommended flow:

Two onboarding modes:

1. Manual provisioning
   - generate QR at provisioning time
   - installer scans QR in a control or field app
   - backend confirms device exists
   - installer binds device to vehicle / college / deployment

2. Future auto-discovery
   - device sends telemetry before manual registration
   - backend creates a pending device and quarantines the message
   - installer or admin binds the discovered device later

Only future telemetry after binding enters the normal operational pipeline.

## Rules

- QR content must be minimal and machine-readable
- QR must not contain secrets like MQTT passwords or JWTs
- QR must identify the physical unit unambiguously
- QR scan must not auto-create a vehicle from device telemetry
- future QR onboarding may claim a pending discovered device, but tenant assignment must remain backend-authorized

## Current-State Note

There is no complete QR onboarding flow or pending-device auto-discovery implemented in the current codebase. This document defines the target contract so frontend, backend, and firmware can converge on the same structure.
