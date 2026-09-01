import asyncio
from datetime import date

from fastapi.testclient import TestClient

from app.models.models import MoodQuote, Notification
from .conftest import TestSession


async def add_mood_quote_and_notification(user_id: str) -> None:
    async with TestSession() as session:
        session.add_all([
            MoodQuote(mood="happy", quote="Small steps count."),
            Notification(user_id=user_id, kind="reminder", message="Track your cycle."),
        ])
        await session.commit()


def test_profile_and_setup_validation(authenticated_client: TestClient):
    profile = authenticated_client.get("/api/v1/profile")
    assert profile.status_code == 200
    assert profile.json()["email"] == "qa@example.com"
    updated = authenticated_client.patch("/api/v1/profile", json={"full_name": "Updated User", "sleep_hours": 7.5, "stress_level": 4})
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated User"
    assert authenticated_client.patch("/api/v1/profile", json={"stress_level": 6}).status_code == 422
    mismatch = authenticated_client.put("/api/v1/profile/setup", json={"cycle_lengths": [28, 29, 30], "period_lengths": [5, 5]})
    assert mismatch.status_code == 422
    setup = authenticated_client.put("/api/v1/profile/setup", json={
        "date_of_birth": "2000-01-01", "menarche_age": 13, "height_cm": 165, "weight_kg": 60,
        "sleep_hours": 7, "stress_level": 3, "exercise_frequency": 1,
        "uses_medication_or_contraceptive": False, "cycle_lengths": [28, 29, 30], "period_lengths": [5, 5, 6],
    })
    assert setup.status_code == 200 and setup.json()["setup_completed"] is True


def test_period_crud_summary_and_error_responses(authenticated_client: TestClient):
    invalid = authenticated_client.post("/api/v1/periods", json={"start_date": "2026-08-10", "end_date": "2026-08-09"})
    assert invalid.status_code == 422
    created = authenticated_client.post("/api/v1/periods", json={"start_date": "2026-08-01", "end_date": "2026-08-05"})
    assert created.status_code == 201
    period = created.json()
    assert {"id", "start_date", "end_date", "created_at"}.issubset(period)
    assert authenticated_client.post("/api/v1/periods", json={"start_date": "2026-08-01"}).status_code == 409
    changed = authenticated_client.patch(f"/api/v1/periods/{period['id']}", json={"start_date": "2026-08-01", "end_date": "2026-08-06"})
    assert changed.status_code == 200 and changed.json()["end_date"] == "2026-08-06"
    assert authenticated_client.patch("/api/v1/periods/missing", json={"start_date": "2026-08-01"}).status_code == 404
    summary = authenticated_client.get("/api/v1/cycles/summary")
    assert summary.status_code == 200
    assert {"average_cycle_length", "average_period_length", "confidence"}.issubset(summary.json())
    assert authenticated_client.delete(f"/api/v1/periods/{period['id']}").status_code == 204
    assert authenticated_client.delete(f"/api/v1/periods/{period['id']}").status_code == 404


def test_moods_quotes_notifications_and_account(authenticated_client: TestClient):
    user = authenticated_client.get("/api/v1/me").json()
    asyncio.run(add_mood_quote_and_notification(user["id"]))
    mood = authenticated_client.post("/api/v1/moods", json={"mood": "happy", "note": "Feeling good"})
    assert mood.status_code == 201 and mood.json()["mood"] == "happy"
    assert len(authenticated_client.get("/api/v1/moods?limit=500").json()) == 1
    assert authenticated_client.post("/api/v1/moods", json={"mood": "unknown"}).status_code == 422
    assert authenticated_client.get("/api/v1/moods/happy/quote").status_code == 200
    assert authenticated_client.get("/api/v1/moods/unknown/quote").status_code == 422
    notifications = authenticated_client.get("/api/v1/notifications")
    assert notifications.status_code == 200 and len(notifications.json()) == 1
    notification_id = notifications.json()[0]["id"]
    assert authenticated_client.patch(f"/api/v1/notifications/{notification_id}", json={"read": True}).json()["read_at"] is not None
    assert authenticated_client.patch("/api/v1/notifications/missing", json={"read": True}).status_code == 404
    assert authenticated_client.delete("/api/v1/account").status_code == 204
    assert authenticated_client.get("/api/v1/me").status_code == 401


def test_health_and_protected_routes_reject_unauthenticated_requests(client: TestClient):
    assert client.get("/health").json() == {"status": "ok"}
    for path in ("/api/v1/profile", "/api/v1/periods", "/api/v1/cycles/summary", "/api/v1/moods", "/api/v1/notifications"):
        assert client.get(path).status_code == 401
