"""persist actual period days and provenance for reliable calendar history"""
from alembic import op
import sqlalchemy as sa

revision = "20260902_cycle_actual_days"
down_revision = "20260728_mood_quotes"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("cycle_history", sa.Column("source", sa.String(length=20), nullable=False, server_default="onboarding"))
    op.add_column("cycle_history", sa.Column("cycle_end_date", sa.Date(), nullable=True))
    op.create_index("ix_cycle_history_cycle_end_date", "cycle_history", ["cycle_end_date"])
    op.add_column("periods", sa.Column("source", sa.String(length=20), nullable=False, server_default="user_logged"))
    op.create_table("period_days",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="user_logged"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "day", name="uq_period_day_user_day"),
    )
    op.create_index("ix_period_days_user_id", "period_days", ["user_id"])

def downgrade():
    op.drop_index("ix_period_days_user_id", table_name="period_days")
    op.drop_table("period_days")
    op.drop_column("periods", "source")
    op.drop_index("ix_cycle_history_cycle_end_date", table_name="cycle_history")
    op.drop_column("cycle_history", "cycle_end_date")
    op.drop_column("cycle_history", "source")
