# NAVYA Test Results

## Environment and commands

- Date: 2026-09-01
- Backend: Python 3.12.13, FastAPI TestClient, pytest 9.1.1
- Test database: isolated in-memory SQLite via a FastAPI `get_db` dependency override. It does not use the configured PostgreSQL/Render/Neon database.
- ML test runtime: project-pinned XGBoost 3.2.0 and the repository's unchanged v2 model artifact/metadata.
- Backend command: `& .\.test-venv\Scripts\python.exe -m pytest -q` from `backend`
- Frontend static command: `.\node_modules\.bin\eslint.cmd .` from `navya`

## Automated result

Backend suite: **19 total, 19 passed, 0 failed, 0 skipped** in 5.49 seconds.

The test run produced two dependency warnings only: FastAPI/Starlette's TestClient deprecation notice and a NumPy 2.5 joblib deserialization deprecation notice. Neither was an application failure.

| Test ID / Area | Result | Notes |
| -------------- | ------ | ----- |
| AUTH-01 to AUTH-07 | PASS | Registration, validation, login, protected access, refresh rotation, and logout covered. |
| PROF-01 to PROF-03 | PASS | Profile fields and setup history validation covered. |
| PERIOD-01 to PERIOD-03 | PASS | CRUD, chronology, duplicate, and missing-resource cases covered. |
| CYCLE-01 | PASS | Summary response exercised with isolated period data. |
| PRED-01 to PRED-06 | PASS | Real model loading, feature order, normal/irregular/outlier histories, fallbacks, and invalid payloads covered. |
| MOOD-01 to MOOD-03 | PASS | Mood persistence/validation and quotes covered with isolated seeded data. |
| NOTIF-01 / ACCT-01 | PASS | Notification read status and account deletion behavior covered. |
| INT-01 | PASS | Static review found matching endpoint paths, field names, bearer refresh, and error/timeout handling. |
| Frontend lint | FAIL | 20 errors and 12 warnings in existing frontend source. See findings below; no working UI was refactored in this QA pass. |
| JOURNAL-01 / NET-01 / UI-01 | MANUAL TEST REQUIRED | Requires Expo Go/device behavior and real connectivity conditions. |

## Defects found and fixes applied

| Issue | Cause | Fix | Affected files | Regression result |
| ----- | ----- | --- | -------------- | ----------------- |
| Unequal setup history lengths were accepted and silently truncated. | `zip(cycle_lengths, period_lengths)` saved only the shorter list. | Added cross-field validation requiring equal list lengths. | `backend/app/schemas/api.py` | PASS |
| A duplicate period start could reach the database unique constraint and become an unhandled server error. | Endpoint had no duplicate pre-check. | Added explicit owned-period check returning 409. | `backend/app/api/v1/router.py` | PASS |
| Refresh expiry comparison could raise `TypeError` when a database returns a naive datetime. | Compared a potentially naive persisted timestamp to aware UTC. | Treat naive persisted expiry values as UTC before comparison. | `backend/app/api/v1/router.py` | PASS |
| Dashboard showed the prediction-loading state whenever a tab navigation remounted the screen. | Dashboard and Cycle each held their own local prediction state and independently requested the same endpoint. | Added a session-scoped, deduplicated prediction cache shared by Dashboard and Cycle; it is invalidated after auth/setup and successful period changes. | `navya/src/features/cycle/predictionRepository.ts`, `navya/src/app/dashboard.tsx`, `navya/src/app/cycle.tsx`, `navya/src/features/auth/AuthContext.tsx`, `navya/src/features/cycle/CycleContext.tsx` | TypeScript PASS; manual Expo Go verification required |

## Frontend lint findings not changed

The first lint run enabled the project’s existing `expo lint` script by adding Expo’s standard ESLint dependencies/configuration. The direct lint run reports existing errors, principally unescaped apostrophes, React Hooks rules in journal/mood/profile/calendar code, and a render-time `Date.now()` call; it also reports unused-import and duplicate-import warnings. These were not changed because they require frontend behavioral judgment and are outside the minimal backend QA fixes. Resolve and re-run lint before release testing.

No production data was read, created, changed, or deleted.
