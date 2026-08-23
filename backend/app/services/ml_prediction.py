from functools import lru_cache
from pathlib import Path
from statistics import mean
import joblib
import pandas as pd

FEATURE_COLUMNS = [
    "Age", "BMI", "Age_At_Menarche", "Prev_1_Cycle_Length", "Prev_2_Cycle_Length",
    "Prev_3_Cycle_Length", "Prev_1_Period_Length", "Prev_2_Period_Length",
    "Prev_3_Period_Length", "Sleep_Hours", "Stress_Level", "Exercise_Frequency",
    "Medication_Contraceptive",
]
ARTIFACTS = Path(__file__).resolve().parents[1] / "ml_artifacts"

@lru_cache
def load_cycle_artifacts():
    model = joblib.load(ARTIFACTS / "Linear_Regression_cycle.pkl")
    pipeline = joblib.load(ARTIFACTS / "cycle_preprocessing_pipeline.pkl")
    return model, pipeline

def predict_cycle_length(features: dict[str, int | float]) -> tuple[float, float]:
    """Return a bounded ML cycle estimate and mean historical period duration."""
    missing = [column for column in FEATURE_COLUMNS if column not in features]
    if missing: raise ValueError(f"Missing prediction features: {', '.join(missing)}")
    model, pipeline = load_cycle_artifacts()
    frame = pd.DataFrame([{column: features[column] for column in FEATURE_COLUMNS}], columns=FEATURE_COLUMNS)
    transformed = pipeline.transform(frame)
    cycle_length = float(model.predict(transformed)[0])
    # Keep a wellness estimate within the same clinical-data range used in setup validation.
    cycle_length = round(min(60, max(15, cycle_length)), 1)
    period_length = round(mean([features["Prev_1_Period_Length"], features["Prev_2_Period_Length"], features["Prev_3_Period_Length"]]), 1)
    return cycle_length, period_length
