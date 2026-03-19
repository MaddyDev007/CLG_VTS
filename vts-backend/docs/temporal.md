# Temporal

Temporal support is included in the codebase, but the Docker Compose file in this repo does **not** start Temporal services. If you enable it, you must run a Temporal server separately and set `TEMPORAL_ADDRESS`.

## Components
- Temporal Server: `localhost:7233`
- Temporal Web UI: `http://localhost:8233`

## Workflow model
- Workflows are defined in `src/temporal/workflows`.
- Worker lives in `src/temporal/workers/worker.ts`.
- Task queue: `vts-trips`.

## Running the worker
```bash
node dist/temporal/workers/worker.js
```

## UI
Open:
```
http://localhost:8233
```

## Note
If you are not using Temporal, remove `TemporalModule` from `AppModule` to avoid startup failures.
