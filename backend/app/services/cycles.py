from datetime import date, timedelta
from statistics import mean
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import CycleHistory, Period

async def cycle_summary(db: AsyncSession, user_id: str) -> dict:
    periods = list((await db.scalars(select(Period).where(Period.user_id == user_id).order_by(Period.start_date.desc()))).all())
    history = list((await db.scalars(select(CycleHistory).where(CycleHistory.user_id == user_id).order_by(CycleHistory.recorded_at.desc()))).all())
    inferred = [(periods[i].start_date - periods[i + 1].start_date).days for i in range(len(periods) - 1) if 15 <= (periods[i].start_date - periods[i + 1].start_date).days <= 60]
    cycle_lengths = inferred or [row.cycle_length_days for row in history] or [28]
    period_lengths = [(row.end_date - row.start_date).days + 1 for row in periods if row.end_date] or [row.period_length_days for row in history] or [5]
    average_cycle, average_period = round(mean(cycle_lengths)), round(mean(period_lengths))
    latest = periods[0] if periods else None
    next_period = latest.start_date + timedelta(days=average_cycle) if latest else None
    today = date.today(); day = (today - latest.start_date).days + 1 if latest else None
    phase = None
    if day:
        position = ((day - 1) % average_cycle) + 1
        phase = "menstrual" if position <= average_period else "follicular" if position <= 13 else "ovulation" if position <= 16 else "luteal"
    confidence = "high" if len(cycle_lengths) >= 3 else "medium" if len(cycle_lengths) >= 2 else "low"
    return {"average_cycle_length": average_cycle, "average_period_length": average_period, "last_period_start": latest.start_date if latest else None, "next_expected_period": next_period, "prediction_range_start": next_period - timedelta(days=1) if next_period else None, "prediction_range_end": next_period + timedelta(days=1) if next_period else None, "cycle_day": day, "phase": phase, "confidence": confidence}
