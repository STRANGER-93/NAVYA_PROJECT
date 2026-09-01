from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import delete, select
from app.core.security import create_access_token, create_refresh_token, hash_password, hash_token, verify_password
from app.dependencies import CurrentUser, DB
from app.models.models import CycleHistory, MoodEntry, Notification, Period, Profile, RefreshToken, User
from app.schemas.api import CyclePredictionInput, CyclePredictionResponse, LoginInput, MoodInput, MoodQuoteResponse, MoodResponse, NotificationResponse, PeriodInput, PeriodResponse, ProfileInput, ProfileResponse, ReadUpdate, RefreshInput, RegisterInput, SetupInput, TokenResponse, UserResponse
from app.services.cycles import cycle_summary
from app.services.ml_prediction import predict_cycle_length
from app.services.mood_quotes import get_random_mood_quote

router = APIRouter()

def user_response(user: User) -> UserResponse: return UserResponse(id=user.id, email=user.email, full_name=user.full_name, setup_completed=user.setup_completed)
def profile_response(user: User, profile: Profile | None) -> ProfileResponse:
    values = {key: getattr(profile, key) if profile else None for key in ProfileInput.model_fields if key != "full_name"}
    return ProfileResponse(full_name=user.full_name, email=user.email, setup_completed=user.setup_completed, **values)
async def tokens(db: DB, user: User) -> TokenResponse:
    raw, token_hash_value, expiry = create_refresh_token(); db.add(RefreshToken(user_id=user.id, token_hash=token_hash_value, expires_at=expiry)); await db.commit()
    return TokenResponse(access_token=create_access_token(user.id), refresh_token=raw, setup_completed=user.setup_completed)

@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterInput, db: DB):
    if not payload.accepted_terms: raise HTTPException(422, "Terms and Privacy Policy must be accepted")
    if await db.scalar(select(User).where(User.email == payload.email.lower())): raise HTTPException(409, "An account already exists for this email")
    user = User(email=payload.email.lower(), full_name=payload.full_name.strip(), password_hash=hash_password(payload.password)); db.add(user); await db.flush(); db.add(Profile(user_id=user.id)); await db.commit(); await db.refresh(user)
    return await tokens(db, user)

@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginInput, db: DB):
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash): raise HTTPException(401, "Email or password is incorrect")
    return await tokens(db, user)

@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshInput, db: DB):
    record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(payload.refresh_token), RefreshToken.revoked_at.is_(None)))
    expiry = record.expires_at.replace(tzinfo=timezone.utc) if record and record.expires_at.tzinfo is None else record.expires_at if record else None
    if not record or expiry < datetime.now(timezone.utc): raise HTTPException(401, "Refresh token is invalid or expired")
    user = await db.get(User, record.user_id); record.revoked_at = datetime.now(timezone.utc); await db.flush()
    return await tokens(db, user)

@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshInput, db: DB):
    record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(payload.refresh_token)))
    if record: record.revoked_at = datetime.now(timezone.utc); await db.commit()
    return Response(status_code=204)

@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser): return user_response(user)
@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: CurrentUser, db: DB): return profile_response(user, await db.get(Profile, user.id))
@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(payload: ProfileInput, user: CurrentUser, db: DB):
    profile = await db.get(Profile, user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "full_name": user.full_name = value.strip()
        else: setattr(profile, key, value)
    await db.commit(); return profile_response(user, profile)
@router.put("/profile/setup", response_model=ProfileResponse)
async def setup(payload: SetupInput, user: CurrentUser, db: DB):
    profile = await db.get(Profile, user.id)
    for key, value in payload.model_dump(exclude={"cycle_lengths", "period_lengths"}, exclude_unset=True).items():
        if key == "full_name": user.full_name = value.strip()
        else: setattr(profile, key, value)
    await db.execute(delete(CycleHistory).where(CycleHistory.user_id == user.id))
    for cycle, period in zip(payload.cycle_lengths, payload.period_lengths): db.add(CycleHistory(user_id=user.id, cycle_length_days=cycle, period_length_days=period))
    user.setup_completed = True; await db.commit(); return profile_response(user, profile)

@router.get("/periods", response_model=list[PeriodResponse])
async def periods(user: CurrentUser, db: DB): return (await db.scalars(select(Period).where(Period.user_id == user.id).order_by(Period.start_date.desc()))).all()
@router.post("/periods", response_model=PeriodResponse, status_code=201)
async def create_period(payload: PeriodInput, user: CurrentUser, db: DB):
    if payload.end_date and payload.end_date < payload.start_date: raise HTTPException(422, "End date cannot precede start date")
    if await db.scalar(select(Period).where(Period.user_id == user.id, Period.start_date == payload.start_date)):
        raise HTTPException(409, "A period record already exists for this start date")
    period = Period(user_id=user.id, **payload.model_dump()); db.add(period); await db.commit(); await db.refresh(period); return period
@router.patch("/periods/{period_id}", response_model=PeriodResponse)
async def update_period(period_id: str, payload: PeriodInput, user: CurrentUser, db: DB):
    period = await db.scalar(select(Period).where(Period.id == period_id, Period.user_id == user.id))
    if not period: raise HTTPException(404, "Period record not found")
    if payload.end_date and payload.end_date < payload.start_date: raise HTTPException(422, "End date cannot precede start date")
    period.start_date, period.end_date = payload.start_date, payload.end_date; await db.commit(); return period
@router.delete("/periods/{period_id}", status_code=204)
async def delete_period(period_id: str, user: CurrentUser, db: DB):
    period = await db.scalar(select(Period).where(Period.id == period_id, Period.user_id == user.id))
    if not period: raise HTTPException(404, "Period record not found")
    await db.delete(period); await db.commit(); return Response(status_code=204)
@router.get("/cycles/summary")
async def summary(user: CurrentUser, db: DB): return await cycle_summary(db, user.id)
@router.get("/cycles/prediction")
async def saved_ml_cycle_prediction(user: CurrentUser, db: DB):
    profile = await db.get(Profile, user.id)
    histories = list((await db.scalars(select(CycleHistory).where(CycleHistory.user_id == user.id).order_by(CycleHistory.recorded_at.desc(), CycleHistory.id.desc()).limit(3))).all())
    # The database query is newest -> oldest. Convert it so the model helper can
    # explicitly map the newest value to prev_cycle_1 in its oldest -> newest contract.
    histories_oldest_to_newest = list(reversed(histories))
    cycle_lengths = [row.cycle_length_days for row in histories_oldest_to_newest]
    period_lengths = [row.period_length_days for row in histories_oldest_to_newest]
    today = date.today()
    age = None
    if profile and profile.date_of_birth:
        age = today.year - profile.date_of_birth.year - ((today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day))
    prediction = predict_cycle_length(
        age_years=age,
        menarche_age=profile.menarche_age if profile else None,
        height_cm=profile.height_cm if profile else None,
        weight_kg=profile.weight_kg if profile else None,
        sleep_hours=profile.sleep_hours if profile else None,
        stress_level=profile.stress_level if profile else None,
        exercise_frequency=profile.exercise_frequency if profile else None,
        uses_medication_or_contraceptive=profile.uses_medication_or_contraceptive if profile else None,
        cycle_lengths_oldest_to_newest=cycle_lengths,
        period_lengths_oldest_to_newest=period_lengths,
    )
    latest = await db.scalar(select(Period).where(Period.user_id == user.id).order_by(Period.start_date.desc()))
    cycle_days = int(prediction.cycle_length_days)
    period_days = max(1, int(round(prediction.period_length_days)))
    next_period = latest.start_date + timedelta(days=cycle_days) if latest else None
    cycle_day = None; phase = None
    if latest:
        cycle_day = ((today - latest.start_date).days % cycle_days) + 1
        phase = "menstrual" if cycle_day <= period_days else "follicular" if cycle_day <= 13 else "ovulation" if cycle_day <= 16 else "luteal"
    interval = prediction.prediction_interval
    return {"predicted_cycle_length_days": prediction.cycle_length_days, "predicted_period_length_days": prediction.period_length_days, "cycle_prediction_source": "xgboost" if prediction.prediction_method == "machine_learning" else "fallback", "period_prediction_source": "previous_period_average", "prediction_method": prediction.prediction_method, "prediction_status": prediction.prediction_status, "prediction_interval": {"lower_days": interval.lower_days, "upper_days": interval.upper_days, "coverage": interval.coverage} if interval else None, "model_version": prediction.model_version, "last_period_start": latest.start_date if latest else None, "next_expected_period": next_period, "days_until_period": (next_period - today).days if next_period else None, "cycle_day": cycle_day, "phase": phase}
@router.post("/cycles/ml-prediction", response_model=CyclePredictionResponse)
async def ml_cycle_prediction(payload: CyclePredictionInput, user: CurrentUser):
    del user  # authentication is required; the client controls only its own submitted values.
    prediction = predict_cycle_length(
        age_years=payload.age, menarche_age=payload.age_at_menarche,
        height_cm=payload.height_cm, weight_kg=payload.weight_kg,
        sleep_hours=payload.sleep_hours, stress_level=payload.stress_level,
        exercise_frequency=payload.exercise_frequency,
        uses_medication_or_contraceptive=bool(payload.medication_contraceptive),
        cycle_lengths_oldest_to_newest=[payload.prev_3_cycle_length, payload.prev_2_cycle_length, payload.prev_1_cycle_length],
        period_lengths_oldest_to_newest=[payload.prev_3_period_length, payload.prev_2_period_length, payload.prev_1_period_length],
    )
    interval = prediction.prediction_interval
    return CyclePredictionResponse(predicted_cycle_length_days=prediction.cycle_length_days, predicted_period_length_days=prediction.period_length_days, cycle_prediction_source="xgboost" if prediction.prediction_method == "machine_learning" else "fallback", prediction_method=prediction.prediction_method, prediction_status=prediction.prediction_status, prediction_interval={"lower_days": interval.lower_days, "upper_days": interval.upper_days, "coverage": interval.coverage} if interval else None, model_version=prediction.model_version)

@router.get("/moods", response_model=list[MoodResponse])
async def moods(user: CurrentUser, db: DB, limit: int = 100): return (await db.scalars(select(MoodEntry).where(MoodEntry.user_id == user.id).order_by(MoodEntry.logged_at.desc()).limit(min(limit, 100)))).all()
@router.post("/moods", response_model=MoodResponse, status_code=201)
async def create_mood(payload: MoodInput, user: CurrentUser, db: DB):
    mood = MoodEntry(user_id=user.id, **payload.model_dump()); db.add(mood); await db.commit(); await db.refresh(mood); return mood
@router.get("/moods/{mood}/quote", response_model=MoodQuoteResponse)
async def mood_quote(mood: str, user: CurrentUser, db: DB):
    del user
    if mood not in {"happy", "sad", "angry", "anxious", "tired", "stressed"}: raise HTTPException(422, "Unsupported mood")
    quote = await get_random_mood_quote(db, mood)
    if not quote: raise HTTPException(404, "No quote is available for this mood")
    return quote
@router.get("/notifications", response_model=list[NotificationResponse])
async def notifications(user: CurrentUser, db: DB): return (await db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()))).all()
@router.patch("/notifications/{notification_id}", response_model=NotificationResponse)
async def set_read(notification_id: str, payload: ReadUpdate, user: CurrentUser, db: DB):
    notification = await db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if not notification: raise HTTPException(404, "Notification not found")
    notification.read_at = datetime.now(timezone.utc) if payload.read else None; await db.commit(); return notification
@router.delete("/account", status_code=204)
async def delete_account(user: CurrentUser, db: DB): await db.delete(user); await db.commit(); return Response(status_code=204)
