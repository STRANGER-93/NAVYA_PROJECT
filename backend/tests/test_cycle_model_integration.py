import asyncio
import unittest

from pydantic import ValidationError

from app.api.v1.router import ml_cycle_prediction
from app.schemas.api import CyclePredictionInput
from app.services.ml_prediction import build_model_features, load_cycle_model, predict_cycle_length


MODEL_INPUT = {
    "age_years": 26,
    "menarche_age": 13,
    "height_cm": 165.1,
    "weight_kg": 60.0,
    "sleep_hours": 7.0,
    "stress_level": 3,
    "exercise_frequency": 1,
    "uses_medication_or_contraceptive": False,
}


class CycleModelIntegrationTests(unittest.TestCase):
    def prediction(self, cycles, periods=(5, 5, 6)):
        return predict_cycle_length(
            **MODEL_INPUT,
            cycle_lengths_oldest_to_newest=cycles,
            period_lengths_oldest_to_newest=periods,
        )

    def test_feature_order_uses_most_recent_cycle_first(self):
        frame = build_model_features(
            **MODEL_INPUT,
            cycle_lengths_oldest_to_newest=[27, 29, 28, 31, 30],
            period_lengths_oldest_to_newest=[4, 5, 5, 6, 5],
        )
        self.assertEqual(list(frame.columns), [
            "age_years", "menarche_age", "height_cm", "weight_kg", "bmi", "sleep_hours",
            "stress_level", "exercise_frequency", "uses_medication_or_contraceptive", "prev_cycle_1",
            "prev_cycle_2", "prev_cycle_3", "avg_previous_cycle_length", "std_previous_cycle_length",
            "prev_period_1", "prev_period_2", "prev_period_3", "avg_previous_period_length",
        ])
        self.assertEqual(frame.loc[0, "prev_cycle_1"], 30)
        self.assertEqual(frame.loc[0, "prev_cycle_2"], 31)
        self.assertEqual(frame.loc[0, "prev_cycle_3"], 28)

    def test_supported_histories_use_the_model(self):
        for cycles in ([27, 29, 28], [31, 32, 30]):
            result = self.prediction(cycles)
            self.assertEqual(result.prediction_method, "machine_learning")
            self.assertEqual(result.prediction_status, "supported")
            self.assertIsNotNone(result.prediction_interval)

    def test_extreme_history_uses_history_fallback(self):
        result = self.prediction([53, 56, 58])
        self.assertEqual(result.prediction_method, "fallback_history_average")
        self.assertEqual(result.prediction_status, "outside_training_distribution")
        self.assertEqual(result.cycle_length_days, 56)
        self.assertIsNone(result.prediction_interval)

    def test_zero_one_and_two_cycle_fallbacks(self):
        self.assertEqual(self.prediction([]).prediction_method, "fallback_population_median")
        self.assertEqual(self.prediction([31]).prediction_method, "fallback_history_average")
        self.assertEqual(self.prediction([28, 30]).prediction_method, "fallback_history_average")

    def test_direct_model_and_api_endpoint_agree_after_rounding(self):
        payload = CyclePredictionInput(
            age=26, age_at_menarche=13, height_cm=165.1, weight_kg=60,
            prev_1_cycle_length=28, prev_2_cycle_length=29, prev_3_cycle_length=27,
            prev_1_period_length=6, prev_2_period_length=5, prev_3_period_length=5,
            sleep_hours=7, stress_level=3, exercise_frequency=1, medication_contraceptive=0,
        )
        frame = build_model_features(
            **MODEL_INPUT,
            cycle_lengths_oldest_to_newest=[27, 29, 28],
            period_lengths_oldest_to_newest=[5, 5, 6],
        )
        raw = float(load_cycle_model().predict(frame)[0])
        response = asyncio.run(ml_cycle_prediction(payload, object()))
        self.assertEqual(response.predicted_cycle_length_days, float(round(min(60, max(15, raw)))))
        self.assertEqual(response.prediction_method, "machine_learning")

    def test_invalid_direct_input_is_rejected(self):
        with self.assertRaises(ValidationError):
            CyclePredictionInput(
                age=26, age_at_menarche=13, height_cm=165.1, weight_kg=60,
                prev_1_cycle_length=-1, prev_2_cycle_length=29, prev_3_cycle_length=27,
                prev_1_period_length=6, prev_2_period_length=5, prev_3_period_length=5,
                sleep_hours=7, stress_level=3, exercise_frequency=1, medication_contraceptive=0,
            )


if __name__ == "__main__":
    unittest.main()
