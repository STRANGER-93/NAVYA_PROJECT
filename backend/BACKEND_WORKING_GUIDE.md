# NAVYA Backend – Working Guide

## 1. Purpose

The NAVYA backend provides the server-side features needed by the mobile application:

- user registration, login, logout, and token refresh;
- user profile and wellness data storage;
- period, cycle-history, mood, and notification APIs;
- personalized menstrual-cycle prediction using the trained machine-learning model;
- PostgreSQL persistence and Alembic database migrations.

The journal feature is deliberately **not** handled by this backend. Journal entries are stored in the Expo application's local SQLite database so that they remain available offline.

## 2. Technology stack

| Layer | Technology | Role |
| --- | --- | --- |
| API framework | FastAPI | REST API, validation, automatic Swagger documentation |
| Database | PostgreSQL | Persistent user and wellness data |
| ORM | SQLAlchemy (async) | Database models and asynchronous queries |
| Database migration | Alembic | Version-controlled database schema changes |
| Authentication | JWT + refresh tokens | Secure mobile session handling |
| Password hashing | `pwdlib` with Argon2 | Secure password storage |
| ML inference | scikit-learn, pandas, joblib | Cycle-length prediction |
| Containerized database | Docker Compose | Consistent local PostgreSQL setup |

The backend is designed for Python 3.11.

## 3. Project structure

```text
backend/
├── app/
│   ├── api/v1/router.py        # API endpoints
│   ├── core/                   # Configuration, database connection, security
│   ├── models/models.py        # SQLAlchemy database tables
│   ├── schemas/api.py          # Pydantic request/response schemas
│   ├── services/               # Cycle calculations and ML prediction service
│   ├── ml_artifacts/           # Trained .pkl model and preprocessing pipeline
│   └── main.py                 # FastAPI application entry point
├── alembic/versions/           # Database migration files
├── docker-compose.yml          # PostgreSQL container configuration
├── .env.example                # Environment variable template
├── run-backend.cmd             # Windows backend launcher
└── README.md                   # Setup and run instructions
```

## 4. Database design

PostgreSQL stores the data that must be shared between sessions and devices.

| Table | Main responsibility |
| --- | --- |
| `users` | Email, name, hashed password, and setup completion state |
| `profiles` | Date of birth, height, weight, sleep, stress, exercise, medication/contraceptive data, and profile photo |
| `refresh_tokens` | Hashed refresh tokens and their expiry/revocation state |
| `cycle_history` | Previous cycle and period durations used by the ML model |
| `periods` | Recorded period start/end dates |
| `mood_entries` | Mood logs created in the app |
| `notifications` | In-app notification records |

The profile photo is stored in `profiles.avatar_data` as a compressed data URI. The mobile app limits the selected image size before upload, and the API validates the maximum payload length.

### Database migrations

Alembic keeps the schema synchronized across team members. Before running the server, apply all migrations:

```powershell
.\.venv\Scripts\alembic.exe upgrade head
```

Current migration history includes the initial schema and the profile-avatar column.

## 5. Authentication flow

Authentication uses a short-lived access token and a longer-lived refresh token.

1. The app calls `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.
2. The backend verifies credentials and returns an access token and refresh token.
3. The Expo app stores both tokens in `expo-secure-store` rather than AsyncStorage.
4. Protected requests include the header:

   ```http
   Authorization: Bearer <access-token>
   ```

5. If the access token expires, the frontend calls `POST /api/v1/auth/refresh`, saves the replacement tokens, and retries the original request once.
6. Signing out calls `POST /api/v1/auth/logout`, revokes the refresh token in PostgreSQL, and clears the local SecureStore session.

Passwords are never stored directly. They are hashed using Argon2 before insertion into the `users` table.

## 6. Onboarding and personalized prediction flow

After sign-up, the user completes the setup screens. The app sends:

- the last period start date;
- three prior cycle lengths;
- three prior period lengths;
- date of birth and age at menarche;
- height and weight;
- sleep, stress, exercise, and medication/contraceptive information.

The setup endpoint stores the profile and cycle history. The user is then marked as `setup_completed`.

When the dashboard opens, it calls:

```http
GET /api/v1/cycles/prediction
```

The backend retrieves the signed-in user's profile, last three cycle-history records, and latest period record. It runs the prediction model and returns data such as:

- predicted cycle length;
- predicted period duration;
- estimated next period date;
- days until the next period;
- current cycle day;
- estimated phase (`menstrual`, `follicular`, `ovulation`, or `luteal`).

The dashboard, cycle overview, calendar, and AI prediction page use this response, so the values stay consistent across the application.

## 7. Machine-learning model integration

The backend uses the versioned v2 artifacts:

```text
app/ml_artifacts/cycle_length_model_v2_xgboost.joblib
app/ml_artifacts/cycle_length_model_v2_xgboost_metadata.json
```

The self-contained XGBoost pipeline predicts the **next cycle length**. The period duration is calculated as the arithmetic average of up to the three most recent recorded period lengths. The v1 linear-regression artifacts are retained in `app/ml_artifacts/legacy/`.

### Feature order

The model receives these 18 raw features. The serialized pipeline owns preprocessing, so the backend does not scale, encode, or transform the feature frame separately:

```text
age_years, menarche_age, height_cm, weight_kg, bmi, sleep_hours,
stress_level, exercise_frequency, uses_medication_or_contraceptive,
prev_cycle_1, prev_cycle_2, prev_cycle_3, avg_previous_cycle_length,
std_previous_cycle_length, prev_period_1, prev_period_2, prev_period_3,
avg_previous_period_length
```

Cycle history is supplied oldest-to-newest to the feature builder. It explicitly reverses the latest three so `prev_cycle_1` is the most recently completed cycle. The metadata defines a 17–39 day supported range and a 90% split-conformal interval with `q_hat_days = 2.172985076904297`. Histories outside that range use a labelled history-average fallback instead of an extrapolated model prediction.

### Replacing the model later

The application is prepared for model replacement. To change the model:

1. Preserve the previous artifact in `app/ml_artifacts/legacy/` with a clear versioned name.
2. Install the new artifact and its metadata with a clear versioned name.
3. Update `app/services/ml_prediction.py` only after auditing the exact exported feature contract.
4. Add any model-runtime dependency needed to load the serialized artifact.
5. Test `backend/tests/test_cycle_model_integration.py`, the direct endpoint, and the saved-profile prediction endpoint.

## 8. Main API groups

| Group | Example endpoints | Purpose |
| --- | --- | --- |
| Health | `GET /health` | Confirms that the API is running |
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Authentication and session lifecycle |
| Profile | `GET /profile`, `PATCH /profile`, `PUT /profile/setup` | User profile and onboarding data |
| Periods | `GET/POST /periods`, `PATCH/DELETE /periods/{id}` | Period tracking |
| Cycles | `GET /cycles/summary`, `GET /cycles/prediction`, `POST /cycles/ml-prediction` | Cycle data and ML inference |
| Moods | `GET/POST /moods` | Mood tracking |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}` | In-app notifications |

Interactive API documentation is available while the server is running:

```text
http://localhost:8000/docs
```

## 9. Frontend–backend communication

The Expo application communicates with FastAPI through `navya/src/services/api.ts`.

- The API base URL comes from `EXPO_PUBLIC_API_URL`.
- Each request is JSON over HTTP.
- The API client attaches the SecureStore access token automatically.
- Requests have a timeout and display a useful connectivity error if the server is unreachable.
- On a `401 Unauthorized` response, the client refreshes the token and retries once.

### Local browser or emulator

Use a local API URL such as:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1
```

`10.0.2.2` is for the Android emulator only.

### Expo Go on a physical phone

The phone cannot use `localhost` because that would point to the phone itself. Use the development computer's Wi-Fi IPv4 address instead. For example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.71:8000/api/v1
```

The PC and phone must be connected to the same Wi-Fi network. The backend must run in network mode, as described below.

## 10. How to run the backend

### First-time setup

Run these commands from the `backend` directory:

```powershell
Copy-Item .env.example .env

& "C:\Users\ASUS\AppData\Local\Programs\Python\Python311\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e .

docker compose up -d db
.\.venv\Scripts\alembic.exe upgrade head
```

### Normal PC-only development

```powershell
.\run-backend.cmd
```

This starts the API at:

```text
http://localhost:8000
http://localhost:8000/health
http://localhost:8000/docs
```

### Expo Go / physical-phone development

```powershell
.\run-backend.cmd network
```

This binds the API to all local network interfaces. Uvicorn will print `http://0.0.0.0:8000`; this is a bind address, not a browser URL.

Use these URLs instead:

```text
PC browser:    http://localhost:8000/health
Phone browser: http://<PC-LAN-IP>:8000/health
```

For example, when the PC IP is `192.168.1.71`, open:

```text
http://192.168.1.71:8000/health
```

If the phone cannot open this URL, allow Python/Uvicorn through Windows Firewall for Private networks and confirm that both devices are on the same Wi-Fi network.

### Regular startup after initial setup

```powershell
docker compose up -d db
.\.venv\Scripts\alembic.exe upgrade head
.\run-backend.cmd
```

Use `.\run-backend.cmd network` instead of the last command when testing through Expo Go on a physical phone.

## 11. Environment variables

The backend reads configuration from `.env`.

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://navya:navya@localhost:5433/navya
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_MINUTES=30
REFRESH_TOKEN_DAYS=30
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

Important points:

- `.env` contains local secrets and should not be committed to Git.
- `.env.example` is the version that should be committed for collaborators.
- Change `JWT_SECRET` to a long random value before deployment.
- The Docker PostgreSQL port is `5433` on the host machine in this project configuration.

## 12. Team testing checklist

Before testing the mobile application, confirm the following:

1. `docker compose up -d db` reports that the database container is running.
2. `alembic upgrade head` completes successfully.
3. `http://localhost:8000/health` returns `{"status":"ok"}`.
4. For Expo Go, the phone browser can open `http://<PC-LAN-IP>:8000/health`.
5. `navya/.env` contains the correct API URL for the selected test device.
6. Expo is restarted with cache clearing after changing `.env`:

   ```powershell
   npx expo start --lan -c
   ```

7. The backend terminal logs `POST /api/v1/auth/register` with `201 Created` during sign-up, or `POST /api/v1/auth/login` with `200 OK` during sign-in.

This setup keeps the backend reproducible for every team member while allowing both local API testing and physical-device testing.
