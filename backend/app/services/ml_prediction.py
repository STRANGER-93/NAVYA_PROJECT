"""Inference-only integration for NAVYA's versioned cycle-length model."""

from dataclasses import dataclass
from functools import lru_cache
import json
from pathlib import Path
from statistics import mean, pstdev
from typing import Sequence

import joblib
import pandas as pd


ARTIFACTS = Path(__file__).resolve().parents[1] / "ml_artifacts"
ACTIVE_MODEL_PATH = ARTIFACTS / "cycle_length_model_v2_xgboost.joblib"
ACTIVE_METADATA_PATH = ARTIFACTS / "cycle_length_model_v2_xgboost_metadata.json"


@dataclass(frozen=True)
class PredictionInterval:
    lower_days: int
    upper_days: int
    coverage: float


@dataclass(frozen=True)
class CyclePrediction:
    cycle_length_days: float
    period_length_days: float
    prediction_method: str
    prediction_status: str
    prediction_interval: PredictionInterval | None
    model_version: str


@lru_cache
def load_cycle_metadata() -> dict:
    """Load and validate metadata once; it is the model's feature contract."""
    metadata = json.loads(ACTIVE_METADATA_PATH.read_text(encoding="utf-8"))
    required = {
        "model_version", "feature_order", "training_cycle_history_median",
        "training_period_history_median", "supported_cycle_lower_bound",
        "supported_cycle_upper_bound", "q_hat_days", "coverage",
    }
    missing = required - metadata.keys()
    if missing:
        raise ValueError(f"Cycle-model metadata is missing: {', '.join(sorted(missing))}")
    return metadata


@lru_cache
def load_cycle_model():
    """Load the serialized self-contained sklearn/XGBoost pipeline once."""
    return joblib.load(ACTIVE_MODEL_PATH)


def _period_estimate(period_lengths_oldest_to_newest: Sequence[int | float], metadata: dict) -> float:
    recent_periods = list(period_lengths_oldest_to_newest)[-3:]
    return round(float(mean(recent_periods)) if recent_periods else float(metadata["training_period_history_median"]), 1)


def build_model_features(
    *,
    age_years: int,
    menarche_age: int,
    height_cm: float,
    weight_kg: float,
    sleep_hours: float,
    stress_level: int,
    exercise_frequency: int,
    uses_medication_or_contraceptive: bool,
    cycle_lengths_oldest_to_newest: Sequence[int | float],
    period_lengths_oldest_to_newest: Sequence[int | float],
) -> pd.DataFrame:
    """Build exactly the 18 raw features expected by the exported pipeline."""
    metadata = load_cycle_metadata()
    cycles = list(cycle_lengths_oldest_to_newest)
    periods = list(period_lengths_oldest_to_newest)
    if len(cycles) < 3:
        raise ValueError("At least three completed cycle histories are required for ML inference")

    # Histories are supplied oldest -> newest. The trained contract defines
    # prev_cycle_1 as the most recently completed cycle, then prev_2 and prev_3.
    recent_cycles = cycles[-3:]
    prev_cycle_1, prev_cycle_2, prev_cycle_3 = reversed(recent_cycles)
    recent_periods = periods[-3:]
    period_fill = float(mean(recent_periods)) if recent_periods else float(metadata["training_period_history_median"])
    padded_periods = recent_periods + [period_fill] * (3 - len(recent_periods))
    prev_period_1, prev_period_2, prev_period_3 = reversed(padded_periods)
    bmi = float(weight_kg) / ((float(height_cm) / 100) ** 2)
    row = {
        "age_years": int(age_years), "menarche_age": int(menarche_age),
        "height_cm": float(height_cm), "weight_kg": float(weight_kg), "bmi": bmi,
        "sleep_hours": float(sleep_hours), "stress_level": int(stress_level),
        "exercise_frequency": int(exercise_frequency),
        "uses_medication_or_contraceptive": int(uses_medication_or_contraceptive),
        "prev_cycle_1": float(prev_cycle_1), "prev_cycle_2": float(prev_cycle_2), "prev_cycle_3": float(prev_cycle_3),
        "avg_previous_cycle_length": float(mean(recent_cycles)), "std_previous_cycle_length": float(pstdev(recent_cycles)),
        "prev_period_1": float(prev_period_1), "prev_period_2": float(prev_period_2), "prev_period_3": float(prev_period_3),
        "avg_previous_period_length": float(mean([prev_period_1, prev_period_2, prev_period_3])),
    }
    feature_order = metadata["feature_order"]
    return pd.DataFrame([[row[name] for name in feature_order]], columns=feature_order)


def predict_cycle_length(
    *,
    age_years: int | None,
    menarche_age: int | None,
    height_cm: float | None,
    weight_kg: float | None,
    sleep_hours: float | None,
    stress_level: int | None,
    exercise_frequency: int | None,
    uses_medication_or_contraceptive: bool | None,
    cycle_lengths_oldest_to_newest: Sequence[int | float],
    period_lengths_oldest_to_newest: Sequence[int | float],
) -> CyclePrediction:
    """Choose a safe fallback or run the new exported model pipeline."""
    metadata = load_cycle_metadata()
    cycles = list(cycle_lengths_oldest_to_newest)
    period_length = _period_estimate(period_lengths_oldest_to_newest, metadata)
    model_version = str(metadata["model_version"])
    if not cycles:
        return CyclePrediction(float(round(float(metadata["training_cycle_history_median"]))), period_length, "fallback_population_median", "not_enough_personal_data", None, model_version)
    if len(cycles) < 3:
        return CyclePrediction(float(round(mean(cycles))), period_length, "fallback_history_average", "not_enough_cycle_history", None, model_version)

    recent_cycles = cycles[-3:]
    lower = float(metadata["supported_cycle_lower_bound"])
    upper = float(metadata["supported_cycle_upper_bound"])
    if min(recent_cycles) < lower or max(recent_cycles) > upper:
        return CyclePrediction(float(round(mean(recent_cycles))), period_length, "fallback_history_average", "outside_training_distribution", None, model_version)

    profile_values = [age_years, menarche_age, height_cm, weight_kg, sleep_hours, stress_level, exercise_frequency, uses_medication_or_contraceptive]
    if any(value is None for value in profile_values):
        return CyclePrediction(float(round(mean(recent_cycles))), period_length, "fallback_history_average", "incomplete_profile", None, model_version)

    features = build_model_features(
        age_years=age_years, menarche_age=menarche_age, height_cm=height_cm, weight_kg=weight_kg,
        sleep_hours=sleep_hours, stress_level=stress_level, exercise_frequency=exercise_frequency,
        uses_medication_or_contraceptive=uses_medication_or_contraceptive,
        cycle_lengths_oldest_to_newest=cycles, period_lengths_oldest_to_newest=period_lengths_oldest_to_newest,
    )
    # The v2 artifact is a complete pipeline, so no backend transform/imputation is applied.
    raw_prediction = float(load_cycle_model().predict(features)[0])
    final_days = int(round(min(60, max(15, raw_prediction))))
    q_hat = float(metadata["q_hat_days"])
    return CyclePrediction(
        float(final_days), period_length, "machine_learning", "supported",
        PredictionInterval(max(15, int(round(final_days - q_hat))), min(60, int(round(final_days + q_hat))), float(metadata["coverage"])),
        model_version,
    )
