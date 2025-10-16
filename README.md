# 🧾 Document Extraction Tool

AI-powered PDF extraction system for government and agricultural reports.  
Built with **Next.js**, **NestJS**, and **PostgreSQL**, featuring a background worker for asynchronous PDF parsing and OpenAI-based data extraction.

---

## 🚀 Features

- 📄 **PDF Upload & Listing**
  - Upload PDFs with automatic slug naming.
  - View file metadata (name, size, upload date).
  - Paginated PDF listing page.

- 🧠 **AI Extraction Pipeline**
  - Converts each PDF page to HTML and analyzes it using OpenAI.
  - Extracts structured data into JSON format, including:
    - goals
    - bmps
    - implementation
    - monitoring
    - outreach
    - geographicAreas
  - Supports complex government and agricultural report layouts.

- ⚙️ **Background Worker**
  - Runs extraction asynchronously to avoid blocking uploads.
  - Saves parsed pages, tables, and images to disk and database.

- 🗄️ **PostgreSQL + TypeORM**
  - Stores uploads, processed PDFs, extracted data, and images.
  - Dockerized Postgres instance for easy local development.

- 🧩 **Modular Architecture**
  - `backend/` for NestJS API + Worker
  - `frontend/` for Next.js app
  - Root scripts to start full environment with a single command.

---

## 🏗️ Monorepo Structure

```
.
├─ .env
├─ docker-compose.yml
├─ package.json
├─ frontend/                  # Next.js app (UI)
│  ├─ src/app/pdfs/           # Upload & list pages
│  └─ package.json
└─ backend/                   # NestJS API + Worker
   ├─ src/
   │  ├─ main.ts              # API entrypoint
   │  ├─ worker.ts            # Background worker
   │  ├─ upload/              # Upload controller, service, and entity
   │  ├─ processing/          # Extraction logic + OpenAI integration
   │  └─ db/                  # TypeORM config and entities
   └─ package.json
```

---

## ⚙️ Environment Setup

### 1. Clone the Repository

```
git clone gh:juntals01/document-extraction-tool.git
cd document-extraction-tool
```

### 2. Create a `.env` File (at root)

```
# Web
WEB_PORT=3000
API_URL=http://localhost:4000

# API

API_PORT=4000
CORS_ORIGIN=http://localhost:${WEB_PORT}

# OpenAi
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Postgres (Docker)
POSTGRES_USER=docxt
POSTGRES_PASSWORD=docxt
POSTGRES_DB=docxt
POSTGRES_PORT=5433

# Upload dir
UPLOAD_DIR=uploads

# Common DB URL the API will use
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}
```

### 3. Database Setup

Start the Postgres container:

```
npm run infra:up
```

View logs:

```
npm run infra:logs
```

Stop and remove data (⚠️ destructive):

```
npm run infra:down
```

### 4. Development

Run frontend, backend, and worker together:

```
npm install
npm run dev
```

This will:

- Launch the Next.js app on http://localhost:3000
- Launch the NestJS API on http://localhost:4000
- Start the background worker process

---

## 🧩 Backend (NestJS)

### Folder Highlights

| Folder           | Description                              |
| ---------------- | ---------------------------------------- |
| `src/upload`     | Handles PDF uploads & file storage       |
| `src/processing` | Extracts tables, images, and text        |
| `src/ai`         | OpenAI service for structured extraction |
| `src/db`         | Database connection & entities           |
| `src/worker.ts`  | Background job processor                 |

### Common Commands

```
# Start API only
npm run dev:api

# Start Worker only
npm run dev:worker

# Generate migration
npm run typeorm migration:generate -- -n Init

# Run migrations
npm run db:mig:run -w backend

# Generate migrations
npm run db:mig:gen -w backend

# Reset db
npm run db:reset -w backend

```

---

## 🌐 Frontend (Next.js)

### Pages

- `/pdfs` – PDF listing
- `/pdfs/[slug]` – PDF detail + extracted data view

### Key Components

| Component   | Description                                  |
| ----------- | -------------------------------------------- |
| UploadPage  | Upload multiple PDFs and track progress      |
| PdfListPage | Paginated list of uploaded PDFs              |
| ReportView  | Displays extracted report summary and charts |

Run only the frontend:

```
npm run dev:web
```

---
