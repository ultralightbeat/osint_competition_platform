# OSINT Competition Platform

This repository contains a full-stack platform for running OSINT competitions with tournaments and 1v1 rooms, using Flask (backend), React + Vite (frontend), PostgreSQL, Redis, RabbitMQ, Celery workers, and Nginx as a reverse proxy.

## Quick Start (Docker)

1. Copy `.env.example` to `.env` and update secrets.
2. Build and start all services:

```bash
docker compose up -d --build
```

3. Open http://localhost to access the UI. The API is proxied under `/api`.

## Services
- Backend (Flask + Gunicorn)
- Frontend (React + Vite preview)
- PostgreSQL
- Redis (cache, sessions)
- RabbitMQ (message broker for Celery)
- Celery workers (validation, rating, metrics, notifications)
- Celery Beat (scheduled tasks)
- Nginx (reverse proxy)

## Development (Windows)
- Backend dev: run locally with Python and Flask.
- Frontend dev: run Vite dev server.

## Useful Commands

Backend (local):
```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r backend/requirements.txt
set FLASK_APP=src/app.py
flask db upgrade
flask run --host 0.0.0.0 --port 5000
```

Frontend (local):
```bash
cd frontend
npm install
npm run dev -- --host
```

## Task image uploads (S3, up to 3 photos)
- Frontend requests a pre-signed POST via `/api/tasks/image/upload-url`, then uploads files directly to S3 using multipart/form-data.
- Task content stores S3 keys in `content.images` (up to 3 items).
- API responses return temporary signed URLs as `content.image_urls` and `content.image_url` (first image).

Required `.env` variables:
```bash
S3_BUCKET_NAME=your-bucket
S3_REGION=ru-1
S3_ENDPOINT_URL=https://s3.beget.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PRESIGNED_UPLOAD_TTL=600
S3_PRESIGNED_GET_TTL=300
TASK_IMAGE_MAX_SIZE_BYTES=10485760
TASK_IMAGE_MAX_FILES=3
```

Beget example:
```bash
S3_BUCKET_NAME=my-osint-images
S3_REGION=ru-1
S3_ENDPOINT_URL=https://s3.beget.com
```

## Structure
See architectural prompt; folders mirror described components.

## CI/CD (GitHub Actions)

Two workflows are configured:

1. **CI** (`.github/workflows/ci.yml`) on `push`/`pull_request`:
   - Backend: installs dependencies, applies migrations to a clean PostgreSQL instance, checks that `users.is_creator` exists and is configured correctly (`NOT NULL` + server default), then runs syntax compilation.
   - Frontend: installs dependencies and runs production build.
2. **CD** (`.github/workflows/deploy.yml`) on `push` to `main` and manual run:
   - Connects to VPS via SSH.
   - Pulls the target branch.
   - Runs `flask db upgrade` before service restart.
   - Rebuilds and restarts stack via `docker compose -f docker-compose.prod.yml`.

Required GitHub Secrets for deploy:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PROJECT_PATH` (absolute path to project root on VPS)

## VPS deployment guide

1. Prepare VPS:
   - Install Docker Engine and Docker Compose plugin.
   - Install Git.
   - Open ports `80` and `443` in firewall/security group.
2. Clone project and configure environment:
   - `git clone <your-repository-url>`
   - `cd osint-competition-platform`
   - `cp .env.example .env`
   - Fill all production secrets in `.env` (database/JWT/S3/OAuth).
3. First start:
   - `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
4. Verify:
   - `docker compose -f docker-compose.prod.yml ps`
   - `docker compose -f docker-compose.prod.yml logs -f backend`
   - Open your domain in browser.
5. Test CI/CD

