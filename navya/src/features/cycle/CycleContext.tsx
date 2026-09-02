import React, { createContext, useCallback, useMemo, useState } from "react";
import { api } from "../../services/api";
import { clearCyclePredictionCache } from "./predictionRepository";

export type PeriodRecord = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  source: "onboarding" | "user_logged";
};

type CycleContextValue = {
  periodStarted: boolean;
  periodEnded: boolean;
  periodStartDate: Date | null;
  periodEndDate: Date | null;
  setPeriodStarted: (started: boolean) => void;
  setPeriodEnded: (ended: boolean) => void;
  setPeriodStartDate: (date: Date) => void;
  setPeriodEndDate: (date: Date) => void;
  completePeriod: (date: Date) => void;
  history: PeriodRecord[];
  prediction: CalendarPrediction | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setPeriodDay: (date: Date, isPeriod: boolean) => Promise<void>;
};
export type CalendarPrediction = { predicted_cycle_length_days: number; predicted_period_length_days: number; last_period_start: string | null; next_expected_period: string | null; days_until_period: number | null; cycle_day: number | null; phase: string | null; prediction_method?: string; prediction_status?: string; prediction_interval?: { lower_days: number; upper_days: number; coverage: number } | null };
type CalendarPayload = { actual_periods: { id: string; start_date: string; end_date: string | null; source: "onboarding" | "user_logged" }[]; prediction: CalendarPrediction };
const fromPayload = (payload: CalendarPayload): PeriodRecord[] => payload.actual_periods.map((record) => ({ id: record.id, startDate: new Date(`${record.start_date}T00:00:00`), endDate: record.end_date ? new Date(`${record.end_date}T00:00:00`) : null, source: record.source }));

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<PeriodRecord[]>([]);
  const [prediction, setPrediction] = useState<CalendarPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStarted, setPeriodStartedState] = useState(false);
  const [periodEnded, setPeriodEndedState] = useState(false);
  const [periodStartDate, setPeriodStartDateState] = useState<Date | null>(null);
  const [periodEndDate, setPeriodEndDateState] = useState<Date | null>(null);
  const apply = useCallback((payload: CalendarPayload) => { setHistory(fromPayload(payload)); setPrediction(payload.prediction); clearCyclePredictionCache(); }, []);
  const refresh = useCallback(async () => { setLoading(true); try { apply(await api.get<CalendarPayload>("/cycles/calendar")); } finally { setLoading(false); } }, [apply]);
  const setPeriodDay = useCallback(async (day: Date, isPeriod: boolean) => { setLoading(true); try { apply(await api.post<CalendarPayload>("/cycles/period-days", { day: day.toISOString().slice(0, 10), is_period: isPeriod })); } finally { setLoading(false); } }, [apply]);

  const value = useMemo<CycleContextValue>(() => ({
    history, prediction, loading, refresh, setPeriodDay,
    periodStarted, periodEnded, periodStartDate, periodEndDate,
    setPeriodStarted: (started) => { setPeriodStartedState(started); if (!started) { setPeriodEndedState(false); setPeriodStartDateState(null); setPeriodEndDateState(null); } },
    setPeriodEnded: setPeriodEndedState,
    setPeriodStartDate: (date) => { setPeriodStartDateState(date); void setPeriodDay(date, true); },
    setPeriodEndDate: setPeriodEndDateState,
    completePeriod: (date) => { if (!periodStartDate) return; setPeriodEndDateState(date); setPeriodEndedState(true); setPeriodStartedState(false); const days = Math.round((date.getTime() - periodStartDate.getTime()) / 86400000); void Promise.all(Array.from({ length: Math.max(0, days) + 1 }, (_, index) => setPeriodDay(new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), periodStartDate.getDate() + index), true))); },
  }), [history, loading, periodEnded, periodEndDate, periodStartDate, periodStarted, prediction, refresh, setPeriodDay]);

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}

export function useCycle() {
  const context = React.use(CycleContext);
  if (!context) throw new Error("useCycle must be used within CycleProvider.");
  return context;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function cyclePhase(date: Date, lastPeriodStart: Date | null, cycleLength = 28, periodLength = 5) {
  if (!lastPeriodStart) return "Luteal";
  const diff = Math.floor((startOfDay(date).getTime() - startOfDay(lastPeriodStart).getTime()) / 86400000);
  const cycleDay = ((diff % cycleLength) + cycleLength) % cycleLength + 1;
  if (cycleDay <= periodLength) return "Menstrual";
  if (cycleDay <= 13) return "Follicular";
  if (cycleDay <= 16) return "Ovulation";
  return "Luteal";
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
