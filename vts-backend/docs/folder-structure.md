# Folder Structure

```
src/
├─ modules/
├─ mqtt/
├─ temporal/
├─ websocket/
├─ config/
└─ migrations/
```

- `modules/`: domain APIs and entities
- `mqtt/`: ingestion pipeline
- `temporal/`: workflow orchestration (external server required)
- `websocket/`: Socket.IO gateway
- `config/`: env + DB config
- `migrations/`: DB migrations
