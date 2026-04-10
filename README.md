# CLG VTS

This repository now uses a single repo-level Docker Compose setup for all runnable projects except `Firmware`.

Containerized projects:
- `code/vts-backend`
- `code/vts-frontend`
- `code/vts-device-simulator`

Supporting containers:
- PostgreSQL
- Mosquitto
- Redis
- Temporal
- Temporal UI

The shared orchestration file lives at [docker-compose.yml](/home/maheshkumar/projects/CLG_VTS/docker-compose.yml).

The documentation hub now lives in [VTS-Control Tower/docs/README.md](/home/maheshkumar/projects/CLG_VTS/code/VTS-Control%20Tower/docs/README.md).

For Docker operations, see [docker-guide.md](/home/maheshkumar/projects/CLG_VTS/code/VTS-Control%20Tower/docs/operations/docker-guide.md).
