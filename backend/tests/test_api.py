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
        "uses_medication_or_contraceptive": False, "last_period_start_date": "2026-08-25", "cycle_lengths": [28, 29, 30], "period_lengths": [5, 5, 6],
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


def test_calendar_uses_only_actual_days_and_rebuilds_after_edits(authenticated_client: TestClient):
    setup = authenticated_client.put("/api/v1/profile/setup", json={
        "date_of_birth": "2000-01-01", "menarche_age": 13, "height_cm": 165, "weight_kg": 60,
        "sleep_hours": 7, "stress_level": 3, "exercise_frequency": 1, "uses_medication_or_contraceptive": False,
        "last_period_start_date": "2026-08-25", "cycle_lengths": [28, 29, 30], "period_lengths": [5, 5, 6],
    })
    assert setup.status_code == 200
    actual = authenticated_client.get("/api/v1/cycles/calendar").json()["actual_periods"]
    assert [(row["start_date"], row["end_date"], row["source"]) for row in actual] == [
        ("2026-08-25", "2026-08-29", "onboarding"), ("2026-07-28", "2026-08-01", "onboarding"), ("2026-06-29", "2026-07-04", "onboarding"),
    ]
    for day in ("2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24"):
        response = authenticated_client.post("/api/v1/cycles/period-days", json={"day": day, "is_period": True})
        assert response.status_code == 200
    assert response.json()["actual_periods"][0]["start_date"] == "2026-09-21"
    assert response.json()["actual_periods"][0]["end_date"] == "2026-09-24"
    response = authenticated_client.post("/api/v1/cycles/period-days", json={"day": "2026-09-22", "is_period": False})
    assert response.status_code == 200
    starts = [row["start_date"] for row in response.json()["actual_periods"]]
    assert "2026-09-21" in starts and "2026-09-23" in starts


def test_calendar_reconstructs_phases_and_actual_start_replaces_prediction(authenticated_client: TestClient):
    setup = authenticated_client.put("/api/v1/profile/setup", json={
        "date_of_birth": "2000-01-01", "menarche_age": 13, "height_cm": 165, "weight_kg": 60,
        "sleep_hours": 7, "stress_level": 3, "exercise_frequency": 1, "uses_medication_or_contraceptive": False,
        "last_period_start_date": "2026-08-25", "cycle_lengths": [29, 31, 30], "period_lengths": [5, 4, 5],
    })
    assert setup.status_code == 200
    before = authenticated_client.get("/api/v1/cycles/calendar")
    assert before.status_code == 200
    body = before.json()
    # The three only historical starts are exactly the ones reconstructable
    # from the onboarding anchor and its supplied cycle lengths.
    assert [row["start_date"] for row in body["actual_periods"]] == ["2026-08-25", "2026-07-27", "2026-06-26"]
    phases = {(item["start_date"], item["phase"], item["source"]) for item in body["phase_ranges"]}
    assert ("2026-08-25", "menstrual", "historical_estimate") in phases
    assert ("2026-08-30", "follicular", "historical_estimate") in phases
    assert body["prediction"]["predicted_period_length_days"] == 5

    # Logging an early real start completes the cycle, removes the old future
    # prediction, rolls the history, and produces one new future prediction.
    logged = authenticated_client.post("/api/v1/cycles/period-start", json={"start_date": "2026-09-20", "is_started": True})
    assert logged.status_code == 200
    updated = logged.json()
    assert updated["actual_periods"][0]["start_date"] == "2026-09-20"
    assert updated["prediction"]["last_period_start"] == "2026-09-20"
    assert updated["prediction"]["next_expected_period"] != body["prediction"]["next_expected_period"]
    assert all(item["source"] != "future_prediction" or item["start_date"] != body["prediction"]["next_expected_period"] for item in updated["phase_ranges"])
    removed = authenticated_client.post("/api/v1/cycles/period-start", json={"start_date": "2026-09-20", "is_started": False})
    assert removed.status_code == 200
    assert removed.json()["prediction"]["last_period_start"] == "2026-08-25"


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
