from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

class RegisterInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    accepted_terms: bool
class LoginInput(BaseModel): email: EmailStr; password: str
class RefreshInput(BaseModel): refresh_token: str
class TokenResponse(BaseModel): access_token: str; refresh_token: str; token_type: str = "bearer"; setup_completed: bool
class UserResponse(BaseModel): id: str; email: EmailStr; full_name: str; setup_completed: bool

class ProfileInput(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    date_of_birth: date | None = None; menarche_age: int | None = Field(default=None, ge=8, le=25)
    height_cm: float | None = Field(default=None, ge=50, le=250); weight_kg: float | None = Field(default=None, ge=20, le=300)
    sleep_hours: float | None = Field(default=None, ge=0, le=24); stress_level: int | None = Field(default=None, ge=1, le=5)
    exercise_frequency: int | None = Field(default=None, ge=0, le=2); uses_medication_or_contraceptive: bool | None = None
    avatar_data: str | None = Field(default=None, max_length=3_000_000)
class SetupInput(ProfileInput):
    last_period_start_date: date
    cycle_lengths: list[int] = Field(min_length=1, max_length=12)
    period_lengths: list[int] = Field(min_length=1, max_length=12)
    @field_validator("cycle_lengths")
    @classmethod
    def cycle_range(cls, value):
        if any(day < 15 or day > 60 for day in value): raise ValueError("Cycle lengths must be between 15 and 60 days")
        return value
    @field_validator("period_lengths")
    @classmethod
    def period_range(cls, value):
        if any(day < 1 or day > 14 for day in value): raise ValueError("Period lengths must be between 1 and 14 days")
        return value
    @model_validator(mode="after")
    def history_lengths_match(self):
        if len(self.cycle_lengths) != len(self.period_lengths):
            raise ValueError("Cycle lengths and period lengths must contain the same number of entries")
        return self
class ProfileResponse(ProfileInput): email: EmailStr; setup_completed: bool

class PeriodInput(BaseModel): start_date: date; end_date: date | None = None
class PeriodResponse(PeriodInput): id: str; created_at: datetime; source: str
class PeriodDayInput(BaseModel):
    day: date
    is_period: bool
class PeriodStartInput(BaseModel):
    start_date: date
    is_started: bool
class CalendarPeriodResponse(PeriodResponse): pass
class CalendarPhaseRange(BaseModel):
    start_date: date
    end_date: date
    phase: str
    source: str
class CycleCalendarResponse(BaseModel):
    actual_periods: list[CalendarPeriodResponse]
    phase_ranges: list[CalendarPhaseRange]
    prediction: dict
class MoodInput(BaseModel): mood: str = Field(pattern="^(happy|sad|angry|anxious|tired|stressed)$"); note: str | None = Field(default=None, max_length=2000)
class MoodResponse(MoodInput): id: str; logged_at: datetime
class MoodQuoteResponse(BaseModel): id: str; mood: str; quote: str
class CyclePredictionInput(BaseModel):
    age: int = Field(ge=8, le=100); age_at_menarche: int = Field(ge=7, le=25)
    height_cm: float = Field(ge=100, le=230); weight_kg: float = Field(ge=25, le=250)
    # Retained for callers of the old endpoint; v2 calculates BMI from height and weight.
    bmi: float | None = Field(default=None, ge=10, le=80)
    prev_1_cycle_length: int = Field(ge=15, le=60); prev_2_cycle_length: int = Field(ge=15, le=60); prev_3_cycle_length: int = Field(ge=15, le=60)
    prev_1_period_length: int = Field(ge=1, le=14); prev_2_period_length: int = Field(ge=1, le=14); prev_3_period_length: int = Field(ge=1, le=14)
    sleep_hours: float = Field(ge=1, le=24); stress_level: int = Field(ge=1, le=5); exercise_frequency: int = Field(ge=0, le=2)
    medication_contraceptive: int = Field(ge=0, le=1)
class CyclePredictionResponse(BaseModel):
    predicted_cycle_length_days: float; predicted_period_length_days: float
    cycle_prediction_source: str = "xgboost"; period_prediction_source: str = "previous_period_average"
    prediction_method: str; prediction_status: str
    prediction_interval: dict[str, float | int] | None = None
    model_version: str
class ReadUpdate(BaseModel): read: bool
class NotificationResponse(BaseModel): id: str; kind: str; message: str; created_at: datetime; read_at: datetime | None
