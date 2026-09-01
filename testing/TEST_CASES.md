# NAVYA Test Cases

## Audit and test plan

NAVYA exposes the FastAPI endpoints below under `/api/v1`; `/health` is public. PostgreSQL holds users, profiles, refresh tokens, cycle histories, periods, mood entries, mood quotes, and notifications. Journal entries are intentionally stored only on-device in Expo SQLite (`journal.db`).

Authentication: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`; protected identity/profile: `GET /me`, `GET/PATCH /profile`, `PUT /profile/setup`, `DELETE /account`; cycle: `GET /periods`, `POST /periods`, `PATCH/DELETE /periods/{period_id}`, `GET /cycles/summary`, `GET /cycles/prediction`, and `POST /cycles/ml-prediction`; mood: `GET/POST /moods` and `GET /moods/{mood}/quote`; notifications: `GET /notifications` and `PATCH /notifications/{notification_id}`.

The active prediction artifact is the v2 XGBoost pipeline. Its 18 raw features, in order, are `age_years`, `menarche_age`, `height_cm`, `weight_kg`, calculated `bmi`, `sleep_hours`, `stress_level`, `exercise_frequency`, `uses_medication_or_contraceptive`, `prev_cycle_1`, `prev_cycle_2`, `prev_cycle_3`, `avg_previous_cycle_length`, `std_previous_cycle_length`, `prev_period_1`, `prev_period_2`, `prev_period_3`, and `avg_previous_period_length`. Input histories are submitted oldest-to-newest internally; `prev_*_1` is the most recent. The direct API accepts `age`, `age_at_menarche`, the three cycle and period lengths, lifestyle fields, and optional legacy `bmi` (ignored by v2). Validated direct-input ranges include cycle 15–60 days and period 1–14 days; ML use is limited to the metadata-supported 17–39 cycle range, otherwise a labelled fallback is returned.

| ID | Module | Test Scenario | Input/Action | Expected Result | Test Type |
| -- | ------ | ------------- | ------------ | --------------- | --------- |
| AUTH-01 | Auth | Valid signup | Complete valid registration | 201 and bearer/refresh tokens; no password field | Automated |
| AUTH-02 | Auth | Invalid signup | Empty name, malformed email, short password, or terms declined | 422; no server error | Automated |
| AUTH-03 | Auth | Duplicate signup | Re-register normalized email | 409 | Automated |
| AUTH-04 | Auth | Login | Correct and incorrect/nonexistent credentials | 200 for valid; 401 otherwise | Automated |
| AUTH-05 | Auth | Missing credentials | Empty login body | 422 | Automated |
| AUTH-06 | Auth | Protected route | `GET /me` with and without bearer token | 200 for valid token; 401 otherwise | Automated |
| AUTH-07 | Auth | Refresh and logout | Refresh once, reuse old token, logout new token | Rotation succeeds; stale/revoked tokens return 401 | Automated |
| PROF-01 | Profile | Read/update profile | Valid profile patch | Correct response structure and values | Automated |
| PROF-02 | Profile | Profile validation | Out-of-range stress level | 422 | Automated |
| PROF-03 | Setup | Setup history integrity | Mismatched and valid cycle/period lists | 422 for mismatch; valid setup completes | Automated |
| PERIOD-01 | Menstrual tracking | Create/read/update/delete period | Valid dates and owned record | 201/200/204 with correct JSON | Automated |
| PERIOD-02 | Menstrual tracking | Date and duplicate validation | End before start; same start date twice | 422 and 409, never 500 | Automated |
| PERIOD-03 | Calendar/cycle | Unknown period resource | Patch/delete nonexistent ID | 404 | Automated |
| CYCLE-01 | Cycle summary | Summary after completed period | `GET /cycles/summary` | Average, confidence, and date fields returned | Automated |
| PRED-01 | ML prediction | Metadata and artifact contract | Build features and invoke model | 18 ordered features; numeric prediction | Automated |
| PRED-02 | ML prediction | Stable history | 27–29 day inputs | ML method, bounded numeric result, interval returned | Automated |
| PRED-03 | ML prediction | Slightly irregular history | 27, 29, 31 day inputs | Safe ML response | Automated |
| PRED-04 | ML prediction | Outside model distribution | 53, 54, 56 day inputs | Labelled history fallback; no interval | Automated |
| PRED-05 | ML prediction | Missing/invalid input | Empty body, null, wrong type, and out-of-range values | 422; endpoint does not crash | Automated |
| PRED-06 | Saved prediction | Profile/history flow | Incomplete then complete setup | Appropriate fallback then ML result | Automated |
| MOOD-01 | Mood | Create and list mood | Valid mood and note | 201 and owned history list | Automated |
| MOOD-02 | Mood | Mood validation | Unsupported mood | 422 | Automated |
| MOOD-03 | Mood quotes | Existing/missing/invalid quote state | Seeded valid quote and invalid mood | 200 for existing; 422 for invalid | Automated |
| NOTIF-01 | Notifications | List and mark read | Existing and nonexistent notification IDs | Updated timestamp / 404 | Automated |
| ACCT-01 | Account | Delete account | Authenticated delete then `/me` | 204 then 401 | Automated |
| JOURNAL-01 | Journal | Local create/edit/delete/search | Expo Go on device using `journal.db` | Entries persist locally and failures show UI feedback | MANUAL TEST REQUIRED |
| INT-01 | Frontend/backend | URL and contract audit | Review `src/services/api.ts` and callers | Environment URL, bearer refresh, 15s timeout, matching payloads | Static audit |
| NET-01 | Network | API unavailable/timeout | Disable network or stop reachable backend | No crash; user sees safe error/empty state as implemented | MANUAL TEST REQUIRED |
| UI-01 | Mobile UI | Keyboard, navigation, screen sizes | Android device/Expo Go | Controls remain usable; no clipping or crash | MANUAL TEST REQUIRED |
