# VTS Backend

The backend can run locally with `npm`, or as part of the repo-level Docker Compose deployment for EC2.

## Local backend workflow

1. Start shared infrastructure:
```bash
docker compose -f ../../docker-compose.yml up -d postgres mosquitto
```

2. Start the backend:
```bash
cd vts-backend
npm ci
npm run start:dev
```

3. Start the frontend from `../vts-frontend` when needed:
```bash
cd vts-frontend
npm ci
npm run dev
```

## Docker deployment

The production-oriented compose file lives at:

```bash
../../docker-compose.yml
```

Use the EC2 deployment guide for the exact env files, build commands, simulator profile, and low-memory recommendations:

- [/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/operations/docker-guide.md](/home/maheshkumar/projects/CLG_VTS/code/VTS-Control%20Tower/docs/operations/docker-guide.md)

Key runtime notes:
- Backend routes are expected under `/api` in the Docker deployment path.
- Temporal is optional and disabled by default.
- Redis-backed telemetry state is optional and defaults to in-memory mode.

## Docs
Project documentation has been centralized in Control Tower:

- `/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/README.md`
- backend reference docs: `/home/maheshkumar/projects/CLG_VTS/code/VTS-Control Tower/docs/reference/backend`
