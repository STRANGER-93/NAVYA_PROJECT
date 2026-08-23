"""Create and seed mood quotes.

Revision ID: 20260728_mood_quotes
Revises: 20260727_profile_avatar
"""

from alembic import op
import sqlalchemy as sa


revision = "20260728_mood_quotes"
down_revision = "20260727_profile_avatar"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "mood_quotes" not in inspector.get_table_names():
        op.create_table(
            "mood_quotes",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("mood", sa.String(length=20), nullable=False),
            sa.Column("quote", sa.Text(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_mood_quotes_mood", "mood_quotes", ["mood"], unique=False)
    elif "ix_mood_quotes_mood" not in {index["name"] for index in inspector.get_indexes("mood_quotes")}:
        op.create_index("ix_mood_quotes_mood", "mood_quotes", ["mood"], unique=False)
    seed_rows = [
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000001", "mood": "happy", "quote": "Let this good moment be something you notice and keep close.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000002", "mood": "happy", "quote": "Your joy matters. Give it room to brighten the rest of your day.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000003", "mood": "sad", "quote": "You do not have to rush through this feeling. Be gentle with yourself.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000004", "mood": "sad", "quote": "A hard moment can be held one small breath at a time.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000005", "mood": "angry", "quote": "Pause and breathe. You can choose your next step after the feeling settles.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000006", "mood": "angry", "quote": "Your feelings are valid; give yourself space before carrying them forward.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000007", "mood": "anxious", "quote": "Come back to this moment. You only need to take the next small step.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000008", "mood": "anxious", "quote": "Slow your breath and notice what is steady around you right now.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000009", "mood": "tired", "quote": "Rest is a need, not something you have to earn.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000010", "mood": "tired", "quote": "Let your body have the softness and pause it is asking for.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000011", "mood": "stressed", "quote": "You are allowed to slow down. One steady breath can make room for calm.", "is_active": True},
        {"id": "e68dd1b4-5c1a-4001-8b48-000000000012", "mood": "stressed", "quote": "Focus on one manageable thing; the rest can wait for a moment.", "is_active": True},
    ]
    for row in seed_rows:
        bind.execute(sa.text("INSERT INTO mood_quotes (id, mood, quote, is_active) VALUES (:id, :mood, :quote, :is_active) ON CONFLICT (id) DO NOTHING"), row)


def downgrade() -> None:
    bind = op.get_bind()
    if "mood_quotes" in sa.inspect(bind).get_table_names():
        op.drop_index("ix_mood_quotes_mood", table_name="mood_quotes")
        op.drop_table("mood_quotes")
