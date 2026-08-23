from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import MoodQuote


async def get_random_mood_quote(db: AsyncSession, mood: str) -> MoodQuote | None:
    statement = select(MoodQuote).where(MoodQuote.mood == mood, MoodQuote.is_active.is_(True)).order_by(func.random()).limit(1)
    return await db.scalar(statement)
