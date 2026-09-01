import { api } from "../../services/api";
import type { PredictionInterval } from "./predictionReliability";

export type CyclePrediction = {
  predicted_cycle_length_days: number;
  predicted_period_length_days: number;
  last_period_start: string | null;
  next_expected_period: string | null;
  days_until_period: number | null;
  cycle_day: number | null;
  phase: string | null;
  prediction_method?: string;
  prediction_status?: string;
  prediction_interval?: PredictionInterval | null;
};

let cachedPrediction: CyclePrediction | null = null;
let predictionRequest: Promise<CyclePrediction> | null = null;

export function getCachedCyclePrediction() {
  return cachedPrediction;
}

export async function getCyclePrediction() {
  if (cachedPrediction) return cachedPrediction;
  if (predictionRequest) return predictionRequest;

  predictionRequest = api.get<CyclePrediction>("/cycles/prediction")
    .then((prediction) => {
      cachedPrediction = prediction;
      return prediction;
    })
    .finally(() => {
      predictionRequest = null;
    });
  return predictionRequest;
}

export function clearCyclePredictionCache() {
  cachedPrediction = null;
  predictionRequest = null;
}
