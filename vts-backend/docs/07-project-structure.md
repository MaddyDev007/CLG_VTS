# Project Structure

```
src/
├─ app.module.ts
├─ main.ts
├─ config/
│  ├─ database.config.ts
│  ├─ mqtt.config.ts
│  ├─ env.validation.ts
│  └─ typeorm.datasource.ts
├─ common/
│  ├─ guards/
│  └─ utils/
├─ modules/
│  ├─ auth/
│  ├─ users/
│  ├─ vehicles/
│  ├─ devices/
│  ├─ telemetry/
│  ├─ routes/
│  ├─ geofences/
│  ├─ trips/
│  ├─ events/
│  ├─ history/
│  ├─ notifications/
│  └─ profile/
├─ mqtt/
│  ├─ mqtt.module.ts
│  ├─ mqtt.service.ts
│  └─ telemetry.handler.ts
├─ temporal/
│  ├─ temporal.module.ts
│  ├─ temporal.service.ts
│  └─ workflows/
├─ websocket/
│  ├─ telemetry.gateway.ts
│  └─ websocket.module.ts
└─ migrations/
```

## Responsibilities
- **config/**: environment validation, DB and MQTT config.
- **common/**: guards and shared utilities.
- **modules/**: domain modules with controllers, services, entities, DTOs.
- **mqtt/**: ingestion pipeline and telemetry handler.
- **temporal/**: workflow orchestration (requires external Temporal server).
- **websocket/**: Socket.IO gateway.
- **migrations/**: TypeORM migrations.
