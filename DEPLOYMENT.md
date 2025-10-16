# DEPLOYMENT.md — Document Extraction Tool

Production deployment guide for **Next.js frontend**, **NestJS backend + worker**, and **PostgreSQL (Docker)**.

---

## 0) Prerequisites

- Node.js 20+ and npm 10+
- Docker + Docker Compose
- A server/VM for the **backend** (API + worker + Postgres Docker)
- A server/VM or platform for the **frontend** (Next.js)

---

## 1) Environment Variables

Create (or update) the **root** `.env` file (used by both workspaces):

```bash
# API (Backend)
API_PORT=4000
CORS_ORIGIN=<frontend real url>      # e.g. https://docs.example.com

# OpenAI
OPENAI_API_KEY=<your key>
OPENAI_MODEL=gpt-4o-mini

# Postgres (Docker on backend host)
POSTGRES_USER=docxt
POSTGRES_PASSWORD=docxt
POSTGRES_DB=docxt
POSTGRES_PORT=5433

# Upload dir (backend will write here)
UPLOAD_DIR=uploads

# DB URL the API will use
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}

# Frontend
WEB_PORT=3001
NEXT_PUBLIC_API_URL=<backend url>    # e.g. https://api.example.com or http://<server-ip>:4000

```

## Notes

1. CORS_ORIGIN must match your public frontend URL.

NEXT_PUBLIC_API_URL must point to the public API URL.

Keep DATABASE_URL pointing to localhost (the Postgres container runs on the backend host).

2. Production Scripts (one-time setup)
   npm run start:both -w backend

3. Backend Host — Install & Boot Postgres (Docker)
   On the backend instance:

bash

# Install dependencies (monorepo)

npm install

# Start API + Worker together (requires scripts above)

npm run start:both -w backend
If you used the concurrently version, both processes run in parallel.
Otherwise, consider using a process manager (pm2/systemd) in production.

Frontend Host — Build & Start Next.js
On the frontend instance (or same box if co-located):

## Install deps (if not already)

npm install

## Build frontend

npm run build -w frontend

## Start frontend on the specified port

npm run start:both -w frontend

## notes

CORS allows <frontend real url> (CORS_ORIGIN).

uploads/ directory writable by the backend process.

OpenAI key set and valid.

### Database

Docker Postgres is running (docker ps shows docxt-postgres).

API logs show a successful connection to DATABASE_URL.

### Frontend

NEXT_PUBLIC_API_URL points to the public API URL.

App loads on http://<frontend-host>:3001/ (or your domain).

End-to-end

Upload a PDF → after a few minutes, extraction data appears.

## Common Commands

# Backend only

```bash
npm run build -w backend
npm run start:both -w backend
```

# Frontend only

```bash
npm run build -w frontend
npm run start -w frontend
```

### Notes & Tips

When changing environment variables, restart the affected process.

Keep API_PORT and WEB_PORT consistent with firewall/security groups.
