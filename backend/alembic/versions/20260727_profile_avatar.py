"""Add a profile avatar image.

Revision ID: 20260727_profile_avatar
Revises: 20260727_initial
"""

from alembic import op
import sqlalchemy as sa

revision = "20260727_profile_avatar"
down_revision = "20260727_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {column["name"] for column in sa.inspect(bind).get_columns("profiles")}
    if "avatar_data" not in existing_columns:
        op.add_column("profiles", sa.Column("avatar_data", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    existing_columns = {column["name"] for column in sa.inspect(bind).get_columns("profiles")}
    if "avatar_data" in existing_columns:
        op.drop_column("profiles", "avatar_data")
