# Deployment

## Build
```bash
npm install
npm run build
```

## Run
```bash
node dist/main.js
```

## Ports
- API: 3000
- Swagger: 3000/api/docs

## Notes
- Postgres and MQTT must be reachable from the backend host.
- If Temporal is enabled, ensure `TEMPORAL_ADDRESS` is reachable.
- The repo Docker Compose file only starts PostgreSQL for development.
