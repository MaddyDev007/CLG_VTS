# Codex Guidelines

This document defines how Codex should reason about and modify the VTS repos consistently.

## Read This First

Before changing code, Codex should inspect:

- the relevant repo module
- the matching contract document in `VTS-Control Tower/docs`
- any tenancy or event-processing invariants affected by the change

## Global Invariants

Codex must preserve:

- backend as source of truth for ingestion and business logic
- no duplicate stop-event write path; stop logic remains derived in backend
- no tenant-scope bypass for non-super-admin users
- geofence notifications should include geofence names
- stale or unassigned devices must not make vehicles appear moving
- unknown or unassigned device telemetry must never mutate operational fleet state
- frontend should not compute canonical trips/events
- simulators must stay compatible with firmware contracts

Codex must never:

- promote unknown or unassigned telemetry into the operational pipeline
- create vehicles automatically from telemetry
- bypass the quarantine layer

## Cross-Repo Change Rules

If changing a payload contract:

- update firmware contract docs
- update simulator contract docs
- update backend parser/DTO/handler
- update frontend services only if UI consumes that contract directly

If changing tenant scoping:

- update backend policy/service enforcement first
- then update frontend scoped query helpers
- then update docs

If changing event logic:

- update backend logic first
- ensure frontend remains display-only
- document threshold and unit changes

If changing ingestion or device discovery:

- preserve the three safe branches: known+assigned, known+unassigned, unknown
- never auto-create vehicles from telemetry
- quarantine unknown or unassigned payloads instead of dropping them silently
- update device lifecycle and debugging docs in the same task

## Time Rules

Codex must not silently introduce mixed time units.

When touching timestamps:

- state explicitly whether the field is epoch ms, seconds, ISO string, or SQL timestamp
- update docs when normalizing units

## Documentation Rules

When code changes alter cross-repo behavior, Codex should update `VTS-Control Tower/docs` in the same task whenever feasible.

This is mandatory for changes in:

- `Firmware`
- `simulator`
- `vts-backend`
- `vts-device-simulator`
- `vts-frontend`

Priority docs to keep current:

- `03-messaging-spec.md`
- `04-backend-contracts.md`
- `05-frontend-contracts.md`
- `08-data-model.md`
- `09-event-processing.md`

## Legacy Documentation

There are older scattered docs in:

- `VTS-Control Tower/legacy`
- `vts-backend/docs/`

Treat those as historical/reference material unless explicitly refreshed. `VTS-Control Tower/docs` is the intended single source of truth.
