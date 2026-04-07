# Task Management Backend

Simple backend API for task management built with NestJS.

## Project Overview

This project provides a beginner-friendly backend with:
- JWT login
- role-based access (`ADMIN`, `USER`)
- task CRUD and assignment
- audit logs for task actions

It uses Supabase PostgreSQL as the database.

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL (Supabase)
- JWT (Passport JWT)
- Docker

## Features

- Login with email/password
- Role-based authorization
- Task management:
  - admin can create/update/delete/assign tasks
  - user can view own tasks and update own task status
- Audit logs for task changes:
  - task created
  - task updated
  - task deleted
  - task status changed
  - task assignment changed

## Setup Steps

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in project root.
3. Add your Supabase database URL and JWT secret.
4. Run seed to create demo users and sample tasks.
5. Start the server.

## .env Example

```env
DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
JWT_SECRET=secret123
```

## Run Locally

```bash
npm run start:dev
```

App runs on: `http://localhost:3000`

## Run Seed

```bash
npm run seed
```

Seed creates:
- admin user (`admin@test.com`)
- normal user (`user@test.com`)
- sample tasks assigned to normal user

Seed avoids duplicates by checking user email and task title.

## Run With Docker

```bash
docker compose up --build
```

App runs on: `http://localhost:3000`

Docker uses environment variables from `.env` and connects to Supabase PostgreSQL (no local postgres container).

## Demo Credentials

- **Admin**
  - Email: `admin@test.com`
  - Password: `admin123`
- **User**
  - Email: `user@test.com`
  - Password: `user123`

## Main API Endpoints

### Health
- `GET /` - API running check

### Auth
- `POST /auth/login`

### Users (Admin only)
- `GET /users`

### Tasks
- `POST /tasks` (Admin only)
- `GET /tasks` (Admin: all tasks, User: own tasks)
- `GET /tasks/:id` (Admin: any task, User: own task only)
- `PATCH /tasks/:id` (Admin only)
- `PATCH /tasks/:id/status` (Admin or assigned user)
- `DELETE /tasks/:id` (Admin only)

### Audit Logs (Admin only)
- `GET /audit-logs`
- `GET /audit-logs/task/:taskId`
