from functools import lru_cache
import ssl

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://navya:navya@localhost:5432/navya"
    jwt_secret: str = "development-only-change-me"
    access_token_minutes: int = 30
    refresh_token_days: int = 30
    cors_origins: str = "http://localhost:8081,http://localhost:19006"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        """Return a SQLAlchemy URL that is compatible with asyncpg.

        Neon URLs commonly use ``sslmode=require``. That is a psycopg/libpq
        option, so it must not be passed through to asyncpg as a URL query
        parameter. ``async_connect_args`` applies the equivalent TLS setting.
        """
        url = make_url(self.database_url)
        if url.get_backend_name() != "postgresql":
            raise ValueError("DATABASE_URL must use PostgreSQL")

        query = dict(url.query)
        query.pop("sslmode", None)
        return url.set(drivername="postgresql+asyncpg", query=query).render_as_string(hide_password=False)

    @property
    def async_connect_args(self) -> dict[str, ssl.SSLContext]:
        """Configure TLS for cloud PostgreSQL without changing local Docker use."""
        sslmode = make_url(self.database_url).query.get("sslmode", "").lower()
        if sslmode in {"require", "verify-ca", "verify-full"}:
            # Neon presents a publicly trusted certificate; verify it and its host.
            return {"ssl": ssl.create_default_context()}
        return {}

    @property
    def migration_database_url(self) -> str:
        """Return a psycopg URL for Alembic, retaining libpq's sslmode option."""
        url = make_url(self.database_url)
        if url.get_backend_name() != "postgresql":
            raise ValueError("DATABASE_URL must use PostgreSQL")
        return url.set(drivername="postgresql+psycopg").render_as_string(hide_password=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
