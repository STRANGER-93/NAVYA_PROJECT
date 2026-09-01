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

`POST /api/v1/cycles/ml-prediction` is authenticated and uses the self-contained XGBoost pipeline at `app/ml_artifacts/cycle_length_model_v2_xgboost.joblib`, together with `cycle_length_model_v2_xgboost_metadata.json`. The model expects 18 raw features; its preprocessing is already included in the exported pipeline. The direct endpoint now requires `height_cm` and `weight_kg` so that the backend can calculate BMI with the same formula used in training. The old `bmi` field remains accepted for compatibility but is not used for v2 inference.

`GET /api/v1/cycles/prediction` keeps its existing response fields and adds `prediction_method`, `prediction_status`, `prediction_interval`, and `model_version`. It uses the ML model only when three recent cycle histories are within the metadata-supported 17–39-day range; otherwise it returns a clearly labelled history or population fallback. The previous linear-regression artifacts are preserved in `app/ml_artifacts/legacy/`.

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
