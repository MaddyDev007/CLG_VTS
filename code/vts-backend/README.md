# VTS Backend

## Development workflow (local backend)

1. Start database (Docker only)
```bash
docker compose -f ../../docker-compose.yml up -d postgres redis mosquitto temporal temporal-ui
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
Project documentation has been centralized in Control Tower:

- `/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/README.md`
- backend reference docs: `/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/reference/backend`

## Docker

The shared Compose file for the backend, frontend, simulator, and infrastructure now lives at:

```bash
../../docker-compose.yml
```

For full Docker usage and operations, see:

- `/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/operations/docker-guide.md`
