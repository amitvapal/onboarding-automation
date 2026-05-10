# Onboarding Automation

Vendor onboarding triage: upload a W-9, MSA, or invoice; Claude extracts the
fields; a reviewer corrects, approves, or rejects; every change is auditable.

## Demo

Live demo: <https://onboarding-app-lbsq.onrender.com/> _(placeholder — replace once Render service is live)_

## Stack

- **Backend**: FastAPI, SQLAlchemy 2, Alembic, Postgres
- **Frontend**: React + Vite + TypeScript, Tailwind, react-router
- **Extraction**: Claude Sonnet 4.5 via the Anthropic SDK (PDF document blocks + tool use)
- **Deploy**: Docker (multi-stage), Render

## Layout

```
backend/    FastAPI app, SQLAlchemy models, Alembic migrations, tests
frontend/   Vite + React app
samples/    Sample PDFs for the seed script
benchmarks/ Per-prompt-version accuracy CSVs
Dockerfile  Multi-stage: builds frontend, copies into backend image
render.yaml Render blueprint (web service + Postgres)
```

## Local development

1. Copy `.env.example` to `.env` and fill in `ANTHROPIC_API_KEY` plus `DATABASE_URL`.
2. Bring up Postgres + backend:
   ```
   docker compose up --build
   ```
3. Run the frontend dev server (uses Vite proxy at `/api` &rarr; `localhost:8000`):
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Apply migrations and seed sample documents:
   ```
   cd backend
   alembic upgrade head
   python -m app.seed
   ```

## Tests

```
cd backend
pytest
```

## Endpoints

All API routes are prefixed with `/api`. The SPA is served at `/`.

| Method | Path                             | Purpose                                  |
|--------|----------------------------------|------------------------------------------|
| GET    | `/health`                        | Liveness                                 |
| POST   | `/api/extract`                   | Extract fields from an uploaded PDF      |
| POST   | `/api/documents`                 | Upload a PDF, persist row + file         |
| GET    | `/api/documents/{id}/file`       | Stream the original PDF                  |
| POST   | `/api/documents/{id}/extract`    | Re-run extraction on a stored PDF        |
| POST   | `/api/vendors`                   | Create a vendor (status `pending`)       |
| GET    | `/api/vendors`                   | List vendors (optional `?status=`)       |
| PATCH  | `/api/vendors/{id}`              | Edit vendor; writes `before/after` audit |
| POST   | `/api/vendors/{id}/approve`      | Approve; writes audit                    |
| POST   | `/api/vendors/{id}/reject`       | Reject with reason; writes audit         |
| GET    | `/api/vendors/{id}/history`      | Vendor audit log, newest first           |
