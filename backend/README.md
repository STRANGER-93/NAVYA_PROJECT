# NAVYA backend

## Windows setup (Python 3.11)

Run the following commands from `D:\PROJECT\WOMEN_WELLNESS\backend`:

```powershell
Copy-Item .env.example .env
# Edit .env and set a long, random JWT_SECRET before deploying.

& "C:\Users\ASUS\AppData\Local\Programs\Python\Python311\python.exe" -m venv .venv
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .

docker compose up -d db
alembic upgrade head
.\run-backend.cmd
```

`run-backend.cmd` does not require a PowerShell execution-policy change. If you prefer PowerShell scripts and PowerShell blocks them, run this once in the same terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

OpenAPI documentation is available at `http://localhost:8000/docs`, and the health check is `http://localhost:8000/health`. Journal data is intentionally excluded: it remains in the Expo app's local SQLite database for offline access.

For Expo Go on a physical phone, ensure it is on the same Wi-Fi network as this computer, run `./run-backend.cmd network`, and set the Expo app's `EXPO_PUBLIC_API_URL` to this computer's LAN IP. This intentionally prints `http://0.0.0.0:8000`; open the API from the phone using the computer's LAN IP, not `0.0.0.0`. Do not use `10.0.2.2` on a physical device; it is an Android-emulator-only address.

## Cycle prediction

`POST /api/v1/cycles/ml-prediction` is authenticated and uses `Linear_Regression_cycle.pkl` plus `cycle_preprocessing_pipeline.pkl`. It expects the documented 13 raw features in its request schema. The response gives the model-predicted cycle length and the arithmetic mean of the three previous period lengths. To replace the cycle model later, replace both compatible artifacts in `app/ml_artifacts/` and update the model version label in `app/services/ml_prediction.py`.

For Expo, copy `D:\PROJECT\WOMEN_WELLNESS\navya\.env.example` to `.env`. On a physical device, replace `10.0.2.2` with the development machine's LAN IP and include that origin in the backend `CORS_ORIGINS` setting.

## Cloud deployment (Render + Neon)

The application accepts a local Docker URL and a Neon URL through the same
`DATABASE_URL` setting. For Neon, set Render's secret environment variable to
the provider URL, for example:

```text
postgresql://USER:PASSWORD@HOST/navya?sslmode=require
```

The app converts that URL to an asyncpg-safe form and enables verified TLS.
Alembic retains `sslmode=require` when it runs through psycopg.

For a Render web service, use `backend` as the root directory, install with
`pip install -e .`, set the health-check path to `/health`, and start with:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set `ENVIRONMENT=production`, `DATABASE_URL`, and a strong `JWT_SECRET` in
Render's environment settings. Keep those secrets out of Git and Expo. The
included `.python-version` pins Render to Python 3.11.
