# Task Management Backend

NestJS API for the Task Management System.

## Overview

- JWT authentication
- Role-based access (`ADMIN`, `USER`)
- Task CRUD + assignment
- Audit logs for important task events

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- JWT + Passport
- Docker

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in this folder.
3. Add values (example below).
4. Run seed.
5. Start dev server.

## `.env` Example

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_management
JWT_SECRET=replace-with-a-strong-random-secret
```

Use a strong JWT secret in real environments.

## Run Locally

```bash
npm run start:dev
```

API: `http://localhost:5000`

## Seed Demo Data

```bash
npm run seed
```

Creates:
- Admin: `admin@test.com` / `admin123`
- User: `user@test.com` / `user123`
- Sample tasks

## Run With Docker (Full Stack)

From repository root (`E:\analytica`):

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

## API Overview

### Auth
- `POST /auth/login`

### Users (Admin)
- `GET /users`

### Tasks
- `POST /tasks` (Admin)
- `GET /tasks` (Admin: all, User: assigned)
- `GET /tasks/:id` (Admin or owner)
- `PATCH /tasks/:id` (Admin)
- `PATCH /tasks/:id/status` (Admin or assigned user)
- `DELETE /tasks/:id` (Admin)

### Audit Logs (Admin)
- `GET /audit-logs`
- `GET /audit-logs/task/:taskId`
