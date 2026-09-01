export type PredictionInterval = {
  lower_days: number;
  upper_days: number;
  coverage: number;
};

export type PredictionReliability = {
  prediction_method?: string;
  prediction_status?: string;
  prediction_interval?: PredictionInterval | null;
};

export function predictionLabel(prediction?: PredictionReliability | null) {
  return prediction?.prediction_method === "machine_learning" ? "✦ AI PREDICTION" : "✦ CYCLE ESTIMATE";
}

export function predictionReliabilityMessage(prediction?: PredictionReliability | null) {
  if (!prediction) return "Prediction improves as you add more cycle records.";
  if (prediction.prediction_status === "outside_training_distribution") {
    return "Your recent cycles fall outside NAVYA AI's trained range. This estimate uses your own recent-cycle average.";
  }
  if (prediction.prediction_status === "not_enough_cycle_history") {
    return "This estimate uses your available cycle history. Add three complete cycle records for an AI prediction.";
  }
  if (prediction.prediction_status === "not_enough_personal_data") {
    return "Add cycle records and wellness details to receive a personalized prediction.";
  }
  if (prediction.prediction_status === "incomplete_profile") {
    return "Complete your wellness profile to receive an AI prediction.";
  }
  const interval = prediction.prediction_interval;
  if (prediction.prediction_method === "machine_learning" && interval) {
    return `Possible range: ${interval.lower_days}–${interval.upper_days} days (${Math.round(interval.coverage * 100)}% prediction range).`;
  }
  return "Prediction improves as you add more cycle records.";
}
