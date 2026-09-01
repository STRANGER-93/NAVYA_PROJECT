"""Isolated FastAPI test application backed by an in-memory SQLite database."""

import asyncio
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models.models import Base


test_engine = create_async_engine(
    "sqlite+aiosqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


async def override_get_db():
    async with TestSession() as session:
        yield session


async def reset_database() -> None:
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.fixture(autouse=True)
def isolated_database() -> Generator[None, None, None]:
    asyncio.run(reset_database())
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client


def register(client: TestClient, *, email: str = "qa@example.com", password: str = "CorrectHorse1") -> dict:
    response = client.post("/api/v1/auth/register", json={
        "full_name": "QA User", "email": email, "password": password, "accepted_terms": True,
    })
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def authenticated_client(client: TestClient) -> TestClient:
    tokens = register(client)
    client.headers.update({"Authorization": f"Bearer {tokens['access_token']}"})
    return client
