# Temporal

Temporal support is included in the codebase, but it is disabled by default.

Use these env variables:
- `TEMPORAL_ENABLED=false` keeps startup non-blocking
- `TEMPORAL_ADDRESS=` only matters when `TEMPORAL_ENABLED=true`

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
You do not need to remove `TemporalModule` from `AppModule` anymore. Keep `TEMPORAL_ENABLED=false` when Temporal is not in use.
