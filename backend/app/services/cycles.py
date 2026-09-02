from datetime import date, timedelta
from statistics import mean
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import CycleHistory, Period, PeriodDay

PHASE_FOLLICULAR_DAYS = 8
PHASE_OVULATION_DAYS = 3

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

async def set_period_start(db: AsyncSession, user_id: str, start_date: date, is_started: bool) -> list[Period]:
    """Persist one authoritative period-start event.

    PeriodDay remains the compatible storage for existing installs, but the
    calendar action is deliberately a start event, not a request to create a
    separate cycle for every menstrual day.
    """
    return await set_period_day(db, user_id, start_date, is_started)

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

def _range(start: date, end: date, phase: str, source: str) -> dict | None:
    if end < start:
        return None
    return {"start_date": start, "end_date": end, "phase": phase, "source": source}

def phase_ranges_for_cycle(start: date, cycle_length: int, period_length: int, source: str, last_day: date | None = None) -> list[dict]:
    """Build calculated (not medically confirmed) phase ranges for one cycle."""
    cycle_length = max(1, cycle_length)
    period_length = max(1, min(period_length, cycle_length))
    cycle_end = start + timedelta(days=cycle_length - 1)
    if last_day:
        cycle_end = min(cycle_end, last_day)
    if cycle_end < start:
        return []
    menstrual_end = min(cycle_end, start + timedelta(days=period_length - 1))
    follicular_start = menstrual_end + timedelta(days=1)
    follicular_end = min(cycle_end, follicular_start + timedelta(days=PHASE_FOLLICULAR_DAYS - 1))
    ovulation_start = follicular_end + timedelta(days=1)
    ovulation_end = min(cycle_end, ovulation_start + timedelta(days=PHASE_OVULATION_DAYS - 1))
    luteal_start = ovulation_end + timedelta(days=1)
    return [entry for entry in [
        _range(start, menstrual_end, "menstrual", source),
        _range(follicular_start, follicular_end, "follicular", source),
        _range(ovulation_start, ovulation_end, "ovulation", source),
        _range(luteal_start, cycle_end, "luteal", source),
    ] if entry]

async def historical_phase_ranges(db: AsyncSession, user_id: str, through: date) -> list[dict]:
    """Return phases only for cycles anchored by onboarding or real user data."""
    rows = list((await db.scalars(select(CycleHistory).where(CycleHistory.user_id == user_id))).all())
    ranges: list[dict] = []
    # Onboarding stores each reconstructed start in cycle_end_date for backward
    # compatibility. It is the only anchor used here; no dates are invented.
    for row in sorted(rows, key=lambda item: item.cycle_end_date or date.min):
        if row.source == "onboarding" and row.cycle_end_date:
            ranges.extend(phase_ranges_for_cycle(row.cycle_end_date, row.cycle_length_days, row.period_length_days, "historical_estimate", through))

    periods = list((await db.scalars(select(Period).where(Period.user_id == user_id).order_by(Period.start_date))).all())
    # A newly logged start completes the preceding real cycle. Its duration is
    # known only when the preceding period has recorded days.
    for previous, current in zip(periods, periods[1:]):
        length = (current.start_date - previous.start_date).days
        if 15 <= length <= 60 and current.source == "user_logged":
            duration = ((previous.end_date or previous.start_date) - previous.start_date).days + 1
            ranges.extend(phase_ranges_for_cycle(previous.start_date, length, duration, "historical_estimate", through))
    # Dedupe overlaps in favour of a completed real cycle rather than the
    # onboarding estimate that it supersedes.
    by_day: dict[date, dict] = {}
    for entry in ranges:
        cursor = entry["start_date"]
        while cursor <= entry["end_date"]:
            by_day[cursor] = {"start_date": cursor, "end_date": cursor, "phase": entry["phase"], "source": entry["source"]}
            cursor += timedelta(days=1)
    return list(by_day.values())
