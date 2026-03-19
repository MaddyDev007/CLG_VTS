# VTS Backend

## Development workflow (local backend)

1. Start database (Docker only)
```bash
docker compose up -d
```

2. Start backend (local)
```bash
cd vts-backend
npm install
npm run start:dev
```

3. Start frontend (local)
```bash
cd vts-frontend
npm run dev
```

Architecture after change:
- PostgreSQL → Docker
- Backend → Local NestJS
- Frontend → Local React

## Ports
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Postgres: 5432

## Docs
See `/docs` for architecture, API, and operational guides.
