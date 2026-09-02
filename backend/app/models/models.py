from datetime import date, datetime
from uuid import uuid4
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase): pass
def uuid() -> str: return str(uuid4())

class Timestamped:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base, Timestamped):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(255))
    setup_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    profile: Mapped["Profile"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class Profile(Base, Timestamped):
    __tablename__ = "profiles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    menarche_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    stress_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exercise_frequency: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uses_medication_or_contraceptive: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    avatar_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    user: Mapped[User] = relationship(back_populates="profile")

class CycleHistory(Base):
    __tablename__ = "cycle_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    cycle_length_days: Mapped[int] = mapped_column(Integer)
    period_length_days: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(20), default="onboarding")
    cycle_end_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Period(Base, Timestamped):
    __tablename__ = "periods"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="user_logged")
    __table_args__ = (UniqueConstraint("user_id", "start_date", name="uq_period_user_start"),)

class PeriodDay(Base, Timestamped):
    __tablename__ = "period_days"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(20), default="user_logged")
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_period_day_user_day"),)

class MoodEntry(Base, Timestamped):
    __tablename__ = "mood_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    mood: Mapped[str] = mapped_column(String(20))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

class MoodQuote(Base, Timestamped):
    __tablename__ = "mood_quotes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    mood: Mapped[str] = mapped_column(String(20), index=True)
    quote: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Notification(Base, Timestamped):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
