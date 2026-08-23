# NAVYA Deployment and Team Working Guide

This guide records the current NAVYA deployment architecture, the completed
local PostgreSQL-to-Neon migration, Render deployment, and the steps teammates
should use to run the project on their own computers.

## Current architecture

```text
Expo Go / NAVYA mobile app
        |
        | HTTPS
        v
Render FastAPI API
https://navya-backend-2uyg.onrender.com
        |
        v
Neon PostgreSQL

Journal entries remain in SQLite on each user's device.
```

The Expo client uses this public API URL:

```env
EXPO_PUBLIC_API_URL=https://navya-backend-2uyg.onrender.com/api/v1
```

This is a public API address, not a secret. Never put the Neon database URL,
JWT secret, or any password in the Expo app.

## Changes made for cloud deployment

### Backend configuration

The backend now supports both local Docker PostgreSQL and cloud Neon PostgreSQL
through `DATABASE_URL`.

- `backend/.python-version` pins deployment to Python 3.11.
- `backend/app/core/config.py` normalizes PostgreSQL URLs for async SQLAlchemy.
  Neon URLs with `sslmode=require` are converted to an asyncpg-compatible URL
  and use verified TLS connection arguments.
- Alembic uses a psycopg database URL, preserving `sslmode=require` for Neon
  migrations.
- `backend/.env` and `navya/.env` are ignored by Git.
- Database schemas are managed through Alembic; FastAPI no longer automatically
  calls `Base.metadata.create_all()` during development startup.
- The profile-avatar migration is idempotent, so it does not fail if
  `profiles.avatar_data` already exists.

### Render deployment

The deployed FastAPI documentation is available at:

```text
https://navya-backend-2uyg.onrender.com/docs
```

The health endpoint is:

```text
https://navya-backend-2uyg.onrender.com/health
```

Expected health response:

```json
{"status":"ok"}
```

Render service configuration:

| Setting | Value |
| --- | --- |
| Service type | Web Service |
| Runtime | Python 3 |
| Root directory | `backend` |
| Build command | `pip install -e .` |
| Start command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health-check path | `/health` |

Set these values only in Render's environment-variable settings:

```text
PYTHON_VERSION=3.11.9
ENVIRONMENT=production
DATABASE_URL=<Neon connection string>
JWT_SECRET=<long random secret>
ACCESS_TOKEN_MINUTES=30
REFRESH_TOKEN_DAYS=30
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

`DATABASE_URL` and `JWT_SECRET` are secrets. Do not commit, share, or put them
in the mobile app.

## Local PostgreSQL data migrated to Neon

The old Docker PostgreSQL database was backed up before migration:

```text
backend/backups/navya-local-before-neon-20260823.dump
```

The source Docker database contained:

| Record type | Imported records |
| --- | ---: |
| Users | 4 |
| Profiles | 4 |
| Periods | 6 |
| Cycle-history entries | 12 |
| Mood entries | 3 |
| Notifications | 0 |

At the time of migration, Neon already had one newly registered deployed user.
The imported users had no email overlap with that account, so no deployed record
was overwritten.

The migration copied these tables:

```text
users
profiles
cycle_history
periods
mood_entries
notifications
```

It intentionally did not copy `refresh_tokens`. Existing login sessions are
therefore invalid after the move; every user must sign in again with their
existing email and password.

After migration, Neon contained:

```text
users=5
profiles=5
periods=7
mood_entries=3
cycle_history=15
refresh_tokens=1
notifications=0
```

### Repeatable migration procedure

Use this only when moving additional local data. First make a backup:

```powershell
cd D:\PROJECT\WOMEN_WELLNESS\backend
New-Item -ItemType Directory -Force backups
docker compose exec -T db pg_dump -U navya -d navya -Fc -f /tmp/navya-local-backup.dump
docker cp backend-db-1:/tmp/navya-local-backup.dump .\backups\navya-local-backup.dump
```

Before importing, compare local and Neon account emails. Do not blindly import
if the same email exists in both databases; decide which profile and history
should be preserved first. For a no-overlap import, set the Neon URL in the
local `backend/.env`, then run:

```powershell
$neonUrl = ((Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=', '')
docker compose exec -T db pg_dump -U navya -d navya --data-only --table=public.users --table=public.profiles --table=public.cycle_history --table=public.periods --table=public.mood_entries --table=public.notifications | docker compose exec -T db psql "$neonUrl" -v ON_ERROR_STOP=1
```

Verify the resulting Neon table counts afterwards. Never migrate or restore the
`alembic_version` table from the local database into Neon.

## Day-to-day workflow

### Normal team and Expo Go testing

Use the deployed Render + Neon backend. No Docker database is required.

```powershell
cd D:\PROJECT\WOMEN_WELLNESS\navya
npm install
npx expo start --lan --clear
```

Each teammate must create `navya/.env` with:

```env
EXPO_PUBLIC_API_URL=https://navya-backend-2uyg.onrender.com/api/v1
```

Then scan the QR code with Expo Go. The phone can use a different Wi-Fi network
or mobile data because the API is hosted over HTTPS.

### Backend development with local Docker PostgreSQL

Use this only when developing or debugging the backend locally.

1. Install Python 3.11.
2. Create the backend environment and install dependencies:

```powershell
cd D:\PROJECT\WOMEN_WELLNESS\backend
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e .
```

3. Create `backend/.env` from `backend/.env.example`, using the local Docker
   database URL:

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://navya:navya@localhost:5433/navya
JWT_SECRET=replace-with-a-long-random-local-secret
ACCESS_TOKEN_MINUTES=30
REFRESH_TOKEN_DAYS=30
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

4. Start PostgreSQL, run migrations, and start FastAPI:

```powershell
docker compose up -d db
.\.venv\Scripts\alembic upgrade head
.\run-backend.cmd network
```

5. Check the local backend:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

To point Expo at a local backend on a physical phone, change `navya/.env` to
the developer computer's current Wi-Fi IPv4 address:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api/v1
```

Run the backend with `network` so it binds to `0.0.0.0`, keep the phone on the
same Wi-Fi network, then restart Expo with `npx expo start --lan --clear`.

## Teammate setup checklist

1. Clone the GitHub repository.
2. Install Node.js, npm, Expo Go on their phone, Docker Desktop (only for local
   backend work), and Python 3.11 (only for local backend work).
3. For normal mobile testing, create `navya/.env` with the Render API URL.
4. Run `npm install` inside `navya`.
5. Run `npx expo start --lan --clear` inside `navya` and scan the QR code.
6. Register a new account or log in with an existing Neon-migrated account.
7. Never ask for or share `DATABASE_URL`, `JWT_SECRET`, Neon passwords, or
   Render environment-variable values.

## Verification checklist

After a backend deployment, check:

```text
GET /health             -> {"status":"ok"}
GET /docs               -> FastAPI documentation loads
POST /auth/register     -> account is created in Neon
POST /auth/login        -> JWT tokens are returned
PUT /profile/setup      -> profile and cycle-history records are stored
POST /periods           -> period is stored
POST /moods             -> mood is stored
GET /cycles/prediction  -> prediction is returned after complete setup
```

For a Render free instance, the first request after inactivity can take longer
while the service starts. Retrying after it wakes is expected.
