from datetime import date, timedelta
from statistics import mean
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import CycleHistory, Period, PeriodDay

def _groups(days: list[PeriodDay]) -> list[list[PeriodDay]]:
    groups: list[list[PeriodDay]] = []
    for record in days:
        if not groups or record.day != groups[-1][-1].day + timedelta(days=1): groups.append([record])
        else: groups[-1].append(record)
    return groups

async def ensure_period_days(db: AsyncSession, user_id: str) -> None:
    """Backfill old interval rows once so a removed middle day can split an interval."""
    if await db.scalar(select(PeriodDay.id).where(PeriodDay.user_id == user_id).limit(1)): return
    for period in list((await db.scalars(select(Period).where(Period.user_id == user_id))).all()):
        for offset in range(((period.end_date or period.start_date) - period.start_date).days + 1):
            db.add(PeriodDay(user_id=user_id, day=period.start_date + timedelta(days=offset), source=period.source))
    await db.flush()

async def rebuild_periods(db: AsyncSession, user_id: str) -> list[Period]:
    days = list((await db.scalars(select(PeriodDay).where(PeriodDay.user_id == user_id).order_by(PeriodDay.day))).all())
    await db.execute(delete(Period).where(Period.user_id == user_id))
    periods: list[Period] = []
    for group in _groups(days):
        source = "user_logged" if any(day.source == "user_logged" for day in group) else "onboarding"
        period = Period(user_id=user_id, start_date=group[0].day, end_date=group[-1].day, source=source)
        db.add(period); periods.append(period)
    await db.flush(); return periods

async def rebuild_logged_cycle_history(db: AsyncSession, user_id: str, periods: list[Period]) -> None:
    await db.execute(delete(CycleHistory).where(CycleHistory.user_id == user_id, CycleHistory.source == "user_logged"))
    ordered = sorted(periods, key=lambda period: period.start_date)
    for previous, current in zip(ordered, ordered[1:]):
        length = (current.start_date - previous.start_date).days
        if 15 <= length <= 60 and current.source == "user_logged":
            db.add(CycleHistory(user_id=user_id, cycle_length_days=length, period_length_days=(previous.end_date - previous.start_date).days + 1, source="user_logged", cycle_end_date=current.start_date))
    await db.flush()

async def set_period_day(db: AsyncSession, user_id: str, day: date, is_period: bool) -> list[Period]:
    await ensure_period_days(db, user_id)
    record = await db.scalar(select(PeriodDay).where(PeriodDay.user_id == user_id, PeriodDay.day == day))
    if is_period and not record: db.add(PeriodDay(user_id=user_id, day=day, source="user_logged"))
    elif is_period and record: record.source = "user_logged"
    elif not is_period and record: await db.delete(record)
    await db.flush(); periods = await rebuild_periods(db, user_id); await rebuild_logged_cycle_history(db, user_id, periods); await db.commit(); return sorted(periods, key=lambda period: period.start_date, reverse=True)

async def setup_period_history(db: AsyncSession, user_id: str, latest_start: date, cycle_lengths: list[int], period_lengths: list[int]) -> list[Period]:
    await db.execute(delete(PeriodDay).where(PeriodDay.user_id == user_id)); await db.execute(delete(Period).where(Period.user_id == user_id)); await db.execute(delete(CycleHistory).where(CycleHistory.user_id == user_id))
    starts = [latest_start]
    for cycle in cycle_lengths[:2]: starts.append(starts[-1] - timedelta(days=cycle))
    for start, duration in zip(starts, period_lengths[:3]):
        for offset in range(duration): db.add(PeriodDay(user_id=user_id, day=start + timedelta(days=offset), source="onboarding"))
    for index, (cycle, duration) in enumerate(zip(cycle_lengths, period_lengths)):
        db.add(CycleHistory(user_id=user_id, cycle_length_days=cycle, period_length_days=duration, source="onboarding", cycle_end_date=starts[index] if index < len(starts) else None))
    await db.flush(); return await rebuild_periods(db, user_id)

async def model_histories(db: AsyncSession, user_id: str) -> tuple[list[int], list[int]]:
    rows = list((await db.scalars(select(CycleHistory).where(CycleHistory.user_id == user_id))).all())
    rows.sort(key=lambda row: (row.cycle_end_date or date.min, row.recorded_at, row.id)); rows = rows[-3:]
    return [row.cycle_length_days for row in rows], [row.period_length_days for row in rows]

async def cycle_summary(db: AsyncSession, user_id: str) -> dict:
    periods = list((await db.scalars(select(Period).where(Period.user_id == user_id).order_by(Period.start_date.desc()))).all())
    cycles, durations = await model_histories(db, user_id); latest = periods[0] if periods else None
    return {"average_cycle_length": round(mean(cycles)) if cycles else None, "average_period_length": round(mean(durations)) if durations else None, "last_period_start": latest.start_date if latest else None, "confidence": "high" if len(cycles) >= 3 else "medium" if len(cycles) >= 2 else "low"}
