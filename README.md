# CLG VTS

This repository is deployable from a single repo-level Docker Compose setup for all runnable projects except `Firmware`.

Containerized projects:
- `code/vts-backend`
- `code/vts-frontend`
- `code/vts-device-simulator`

Default infrastructure:
- PostgreSQL
- Mosquitto

Optional runtime:
- `vts-device-simulator` via the `simulator` profile

Backend behavior:
- Redis-backed telemetry state is optional and defaults to in-memory mode
- Temporal is optional and disabled by default on EC2

The shared orchestration file lives at [docker-compose.yml](docker-compose.yml).

The documentation hub now lives in [VTS-Control Tower/docs/README.md](code/VTS-Control%20Tower/docs/README.md).

For Docker operations, see [docker-guide.md](code/VTS-Control%20Tower/docs/operations/docker-guide.md).
