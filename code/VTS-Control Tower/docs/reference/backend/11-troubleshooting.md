# Troubleshooting

## TypeORM metadata errors
**Error:** `Column <name> of Entity <EntityName> does not support length property`.
- Ensure UUID/int columns do not include `length`.
- Rebuild: `rm -rf dist && npm run build`.

## Database does not exist
**Error:** `database "vts" does not exist`.
- This happens after `docker compose down -v` wipes the volume.
- Recreate the DB or set `POSTGRES_DB=vts` in compose (already set in repo).
- Restart the backend after the DB exists.

## Database connection refused
**Error:** `connect ECONNREFUSED 127.0.0.1:5432`.
- Start Postgres: `docker compose up -d`.
- Verify `.env` DB_HOST/DB_PORT.

## Env validation failed
**Error:** `Env validation failed: ... isString`.
- Ensure `.env` contains required variables (see `docs/08-environment-config.md`).

## Temporal connection refused
**Error:** `connection error: dial tcp 127.0.0.1:7233`.
- Leave `TEMPORAL_ENABLED=false` unless you really need Temporal.
- If you do enable it, set `TEMPORAL_ADDRESS` to a reachable host.

## MQTT not receiving data
- Confirm broker URL and topic:
  - `MQTT_BROKER_URL`
  - `MQTT_TELEMETRY_TOPIC` (default: `vts/+/telemetry`)
- Check broker logs and device publish topic.

## WebSocket updates not received
- Ensure frontend connects to `/telemetry` or the correct proxied WebSocket origin.
- Listen for `vehicle-update` event.

## Migrations not applied
- Run `npm run migration:run`.
