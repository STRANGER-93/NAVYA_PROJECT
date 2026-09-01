from fastapi.testclient import TestClient

from .conftest import register


def test_register_returns_tokens_without_sensitive_fields(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "full_name": "  Navya Tester  ", "email": "TESTER@EXAMPLE.COM", "password": "CorrectHorse1", "accepted_terms": True,
    })
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"access_token", "refresh_token", "token_type", "setup_completed"}
    assert body["token_type"] == "bearer"
    assert "password" not in response.text.lower()


def test_registration_validation_duplicate_and_terms(client: TestClient):
    assert client.post("/api/v1/auth/register", json={"full_name": "", "email": "bad", "password": "short", "accepted_terms": True}).status_code == 422
    assert client.post("/api/v1/auth/register", json={"full_name": "QA", "email": "qa@example.com", "password": "CorrectHorse1", "accepted_terms": False}).status_code == 422
    register(client)
    assert client.post("/api/v1/auth/register", json={"full_name": "QA", "email": "QA@example.com", "password": "CorrectHorse1", "accepted_terms": True}).status_code == 409


def test_login_failure_cases_and_missing_credentials(client: TestClient):
    register(client)
    success = client.post("/api/v1/auth/login", json={"email": "qa@example.com", "password": "CorrectHorse1"})
    assert success.status_code == 200
    assert "password" not in success.text.lower()
    assert client.post("/api/v1/auth/login", json={"email": "qa@example.com", "password": "wrong"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "CorrectHorse1"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "bad", "password": "CorrectHorse1"}).status_code == 422
    assert client.post("/api/v1/auth/login", json={}).status_code == 422


def test_protected_endpoint_refresh_rotation_and_logout(client: TestClient):
    assert client.get("/api/v1/me").status_code == 401
    tokens = register(client)
    authorized = {"Authorization": f"Bearer {tokens['access_token']}"}
    me = client.get("/api/v1/me", headers=authorized)
    assert me.status_code == 200 and me.json()["email"] == "qa@example.com"
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401
    assert client.post("/api/v1/auth/logout", json={"refresh_token": refreshed.json()["refresh_token"]}).status_code == 204
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refreshed.json()["refresh_token"]}).status_code == 401
