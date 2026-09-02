import React, { createContext, useCallback, useMemo, useState } from "react";
import { ApiError, api } from "../../services/api";
import { clearCyclePredictionCache } from "./predictionRepository";

export type PeriodRecord = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  source: "onboarding" | "user_logged";
};
export type CalendarPhase = "menstrual" | "follicular" | "ovulation" | "luteal";
export type CalendarPhaseRange = { startDate: Date; endDate: Date; phase: CalendarPhase; source: "historical_estimate" | "future_prediction" };

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
  phaseRanges: CalendarPhaseRange[];
  prediction: CalendarPrediction | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setPeriodDay: (date: Date, isPeriod: boolean) => Promise<void>;
  setPeriodStart: (date: Date, isStarted: boolean) => Promise<void>;
};
export type CalendarPrediction = { predicted_cycle_length_days: number; predicted_period_length_days: number; last_period_start: string | null; next_expected_period: string | null; days_until_period: number | null; cycle_day: number | null; phase: string | null; prediction_method?: string; prediction_status?: string; prediction_interval?: { lower_days: number; upper_days: number; coverage: number } | null };
type CalendarPayload = { actual_periods?: { id: string; start_date: string; end_date: string | null; source: "onboarding" | "user_logged" }[]; phase_ranges?: { start_date: string; end_date: string; phase: CalendarPhase; source: "historical_estimate" | "future_prediction" }[]; prediction: CalendarPrediction };
const fromPayload = (payload: CalendarPayload): PeriodRecord[] => (Array.isArray(payload.actual_periods) ? payload.actual_periods : []).map((record) => ({ id: record.id, startDate: new Date(`${record.start_date}T00:00:00`), endDate: record.end_date ? new Date(`${record.end_date}T00:00:00`) : null, source: record.source }));
// Older deployed API versions did not provide phase ranges. Treat that as an
// empty calendar state instead of crashing the entire Cycle module.
const phaseRangesFromPayload = (payload: CalendarPayload): CalendarPhaseRange[] => (Array.isArray(payload.phase_ranges) ? payload.phase_ranges : []).map((range) => ({ ...range, startDate: new Date(`${range.start_date}T00:00:00`), endDate: new Date(`${range.end_date}T00:00:00`) }));

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<PeriodRecord[]>([]);
  const [phaseRanges, setPhaseRanges] = useState<CalendarPhaseRange[]>([]);
  const [prediction, setPrediction] = useState<CalendarPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStarted, setPeriodStartedState] = useState(false);
  const [periodEnded, setPeriodEndedState] = useState(false);
  const [periodStartDate, setPeriodStartDateState] = useState<Date | null>(null);
  const [periodEndDate, setPeriodEndDateState] = useState<Date | null>(null);
  const apply = useCallback((payload: CalendarPayload) => { setHistory(fromPayload(payload)); setPhaseRanges(phaseRangesFromPayload(payload)); setPrediction(payload.prediction); clearCyclePredictionCache(); }, []);
  const refresh = useCallback(async () => { setLoading(true); try { apply(await api.get<CalendarPayload>("/cycles/calendar")); } finally { setLoading(false); } }, [apply]);
  const setPeriodDay = useCallback(async (day: Date, isPeriod: boolean) => { setLoading(true); try { apply(await api.post<CalendarPayload>("/cycles/period-days", { day: day.toISOString().slice(0, 10), is_period: isPeriod })); } finally { setLoading(false); } }, [apply]);
  const setPeriodStart = useCallback(async (date: Date, isStarted: boolean) => { setLoading(true); try { apply(await api.post<CalendarPayload>("/cycles/period-start", { start_date: date.toISOString().slice(0, 10), is_started: isStarted })); } catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; apply(await api.post<CalendarPayload>("/cycles/period-days", { day: date.toISOString().slice(0, 10), is_period: isStarted })); } finally { setLoading(false); } }, [apply]);

  const value = useMemo<CycleContextValue>(() => ({
    history, phaseRanges, prediction, loading, refresh, setPeriodDay, setPeriodStart,
    periodStarted, periodEnded, periodStartDate, periodEndDate,
    setPeriodStarted: (started) => { setPeriodStartedState(started); if (!started) { setPeriodEndedState(false); setPeriodStartDateState(null); setPeriodEndDateState(null); } },
    setPeriodEnded: setPeriodEndedState,
    setPeriodStartDate: (date) => { setPeriodStartDateState(date); void setPeriodStart(date, true); },
    setPeriodEndDate: setPeriodEndDateState,
    completePeriod: (date) => { if (!periodStartDate) return; setPeriodEndDateState(date); setPeriodEndedState(true); setPeriodStartedState(false); const days = Math.round((date.getTime() - periodStartDate.getTime()) / 86400000); void Promise.all(Array.from({ length: Math.max(0, days) + 1 }, (_, index) => setPeriodDay(new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), periodStartDate.getDate() + index), true))); },
  }), [history, loading, periodEnded, periodEndDate, periodStartDate, periodStarted, phaseRanges, prediction, refresh, setPeriodDay, setPeriodStart]);

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

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
