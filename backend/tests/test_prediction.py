from fastapi.testclient import TestClient

from app.services.ml_prediction import build_model_features, load_cycle_metadata, load_cycle_model, predict_cycle_length


VALID_PAYLOAD = {
    "age": 26, "age_at_menarche": 13, "height_cm": 165.1, "weight_kg": 60,
    "prev_1_cycle_length": 28, "prev_2_cycle_length": 29, "prev_3_cycle_length": 27,
    "prev_1_period_length": 6, "prev_2_period_length": 5, "prev_3_period_length": 5,
    "sleep_hours": 7, "stress_level": 3, "exercise_frequency": 1, "medication_contraceptive": 0,
}


def test_metadata_model_and_feature_contract_are_compatible():
    metadata = load_cycle_metadata()
    features = build_model_features(
        age_years=26, menarche_age=13, height_cm=165.1, weight_kg=60, sleep_hours=7, stress_level=3,
        exercise_frequency=1, uses_medication_or_contraceptive=False,
        cycle_lengths_oldest_to_newest=[27, 29, 28], period_lengths_oldest_to_newest=[5, 5, 6],
    )
    assert list(features.columns) == metadata["feature_order"]
    assert features.loc[0, "prev_cycle_1"] == 28
    assert len(features.columns) == 18
    prediction = float(load_cycle_model().predict(features)[0])
    assert isinstance(prediction, float)


def test_prediction_endpoint_supported_irregular_and_fallback_histories(authenticated_client: TestClient):
    stable = authenticated_client.post("/api/v1/cycles/ml-prediction", json=VALID_PAYLOAD)
    assert stable.status_code == 200
    body = stable.json()
    assert body["prediction_method"] == "machine_learning"
    assert 15 <= body["predicted_cycle_length_days"] <= 60
    assert body["prediction_interval"]["coverage"] == load_cycle_metadata()["coverage"]
    irregular = authenticated_client.post("/api/v1/cycles/ml-prediction", json={**VALID_PAYLOAD, "prev_1_cycle_length": 31, "prev_2_cycle_length": 29, "prev_3_cycle_length": 27})
    assert irregular.status_code == 200 and irregular.json()["prediction_method"] == "machine_learning"
    fallback = authenticated_client.post("/api/v1/cycles/ml-prediction", json={**VALID_PAYLOAD, "prev_1_cycle_length": 56, "prev_2_cycle_length": 54, "prev_3_cycle_length": 53})
    assert fallback.status_code == 200
    assert fallback.json()["prediction_method"] == "fallback_history_average"
    assert fallback.json()["prediction_interval"] is None


def test_prediction_validation_rejects_missing_invalid_and_wrong_types(authenticated_client: TestClient):
    assert authenticated_client.post("/api/v1/cycles/ml-prediction", json={}).status_code == 422
    assert authenticated_client.post("/api/v1/cycles/ml-prediction", json={**VALID_PAYLOAD, "prev_1_cycle_length": 14}).status_code == 422
    assert authenticated_client.post("/api/v1/cycles/ml-prediction", json={**VALID_PAYLOAD, "sleep_hours": None}).status_code == 422
    assert authenticated_client.post("/api/v1/cycles/ml-prediction", json={**VALID_PAYLOAD, "stress_level": "high"}).status_code == 422


def test_saved_prediction_uses_profile_history_and_handles_incomplete_profile(authenticated_client: TestClient):
    incomplete = authenticated_client.get("/api/v1/cycles/prediction")
    assert incomplete.status_code == 200
    assert incomplete.json()["prediction_status"] == "not_enough_personal_data"
    setup = authenticated_client.put("/api/v1/profile/setup", json={
        "date_of_birth": "2000-01-01", "menarche_age": 13, "height_cm": 165, "weight_kg": 60,
        "sleep_hours": 7, "stress_level": 3, "exercise_frequency": 1,
        "uses_medication_or_contraceptive": False, "last_period_start_date": "2026-08-25", "cycle_lengths": [27, 29, 28], "period_lengths": [5, 5, 6],
    })
    assert setup.status_code == 200
    saved = authenticated_client.get("/api/v1/cycles/prediction")
    assert saved.status_code == 200 and saved.json()["prediction_method"] == "machine_learning"


def test_service_fallbacks_cover_zero_one_and_two_histories():
    args = dict(age_years=26, menarche_age=13, height_cm=165, weight_kg=60, sleep_hours=7, stress_level=3, exercise_frequency=1, uses_medication_or_contraceptive=False, period_lengths_oldest_to_newest=[])
    assert predict_cycle_length(**args, cycle_lengths_oldest_to_newest=[]).prediction_method == "fallback_population_median"
    assert predict_cycle_length(**args, cycle_lengths_oldest_to_newest=[28]).prediction_method == "fallback_history_average"
    assert predict_cycle_length(**args, cycle_lengths_oldest_to_newest=[28, 30]).prediction_method == "fallback_history_average"
