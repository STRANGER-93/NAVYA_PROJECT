from alembic import context
from sqlalchemy import engine_from_config, pool
from app.core.config import get_settings
from app.models.models import Base

config = context.config
# The app uses asyncpg; Alembic's synchronous migration engine uses psycopg.
# This keeps a cloud URL's ``sslmode=require`` query parameter for psycopg while
# the async app engine receives TLS through asyncpg connect arguments.
config.set_main_option("sqlalchemy.url", get_settings().migration_database_url)
target_metadata = Base.metadata
def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    engine = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()
if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
