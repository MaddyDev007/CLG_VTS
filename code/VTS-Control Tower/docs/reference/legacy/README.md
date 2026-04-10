# VTS Control Tower

This repository folder is the documentation and operations hub for the full VTS workspace.

## Purpose

`VTS-Control Tower` is the canonical place for:

- system-wide architecture
- cross-repository contracts
- operational rules
- onboarding and debugging guides
- Codex change guidelines

## Canonical Documentation Location

All active project documentation must live inside:

- `VTS-Control Tower/docs`

Legacy markdown files that were previously stored at the workspace root have been moved into:

- `VTS-Control Tower/docs/reference/legacy`

Those legacy files are reference material only. New changes should update the canonical docs in `VTS-Control Tower/docs`.

## Update Rule

Whenever any of these repos changes:

- `Firmware`
- `simulator`
- `vts-backend`
- `vts-device-simulator`
- `vts-frontend`

the corresponding documentation in `VTS-Control Tower/docs` must be updated in the same task whenever the change affects behavior, contracts, data shape, tenancy, installation, event logic, or operations.
