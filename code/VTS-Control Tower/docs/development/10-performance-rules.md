# Performance Rules

This document defines non-negotiable rules for keeping the platform operational under sustained telemetry load.

## Database Protection

Do not store every incoming raw message forever without retention rules.

Required controls:

- telemetry retention policy
- sampling/downsampling for long-range analytics
- aggregation tables or rollups where needed
- query indexes on hot dimensions

Current backend already has important telemetry indexes:

- `vehicleId`
- `deviceId`
- `timestamp`
- `collegeId`

## Message Retention

Recommended rules:

- keep raw telemetry at highest resolution only for recent windows
- downsample older telemetry
- retain derived trips/events longer than high-volume raw telemetry

## UI Protection

Do not flood maps or tables with unbounded points.

Rules:

- cap playback/history point counts per request
- use route simplification for large datasets
- live pages should display sampled current state, not every raw sample

Current examples:

- history timeline uses capped rows
- playback components segment route arrays

## Backend Processing Protection

- geocoding should not run for every near-identical point
- geofence checks should use caching/batching where possible
- event creation must be idempotent enough to tolerate reconnect storms

Current examples:

- telemetry address cache
- geofence cache with TTL
- spike filtering in trip distance calculation

## Simulator and Firmware Rules

Simulators and firmware must not create unrealistic load by:

- sending more frequently than configured
- replaying the same sample excessively
- bypassing backoff on reconnect

## Current-State Gap

The current codebase still stores high-resolution telemetry rows directly. This is operationally acceptable for development and modest scale, but production scaling requires explicit retention and aggregation strategy.
