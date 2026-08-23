import React, { createContext, useMemo, useState } from "react";
import { api } from "../../services/api";

export type PeriodRecord = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  cycleLength: number;
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
};

const mockHistory: PeriodRecord[] = [
  { id: "june", startDate: new Date(2026, 5, 12), endDate: new Date(2026, 5, 16), cycleLength: 28 },
  { id: "may", startDate: new Date(2026, 4, 15), endDate: new Date(2026, 4, 20), cycleLength: 27 },
  { id: "april", startDate: new Date(2026, 3, 17), endDate: new Date(2026, 3, 22), cycleLength: 28 },
];

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [periodStarted, setPeriodStartedState] = useState(false);
  const [periodEnded, setPeriodEndedState] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState<Date | null>(null);
  const [periodEndDate, setPeriodEndDate] = useState<Date | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);

  const value = useMemo<CycleContextValue>(() => ({
    periodStarted,
    periodEnded,
    periodStartDate,
    periodEndDate,
    history: periodStartDate ? [{ id: "current", startDate: periodStartDate, endDate: periodEndDate, cycleLength: 28 }, ...mockHistory] : mockHistory,
    setPeriodStarted: (started) => {
      setPeriodStartedState(started);
      if (started) {
        setPeriodEndedState(false);
        setPeriodEndDate(null);
      }
      if (!started) {
        setPeriodEndedState(false);
        setPeriodStartDate(null);
        setPeriodEndDate(null);
      }
    },
    setPeriodEnded: (ended) => {
      setPeriodEndedState(ended);
      if (!ended) setPeriodEndDate(null);
    },
    setPeriodStartDate: (date) => { setPeriodStartDate(date); void api.post<{ id: string }>("/periods", { start_date: date.toISOString().slice(0, 10) }).then((record) => setCurrentPeriodId(record.id)).catch(() => undefined); },
    setPeriodEndDate: (date) => setPeriodEndDate(date),
    completePeriod: (date) => {
      setPeriodEndDate(date);
      setPeriodEndedState(true);
      setPeriodStartedState(false);
      if (currentPeriodId && periodStartDate) void api.patch(`/periods/${currentPeriodId}`, { start_date: periodStartDate.toISOString().slice(0, 10), end_date: date.toISOString().slice(0, 10) }).catch(() => undefined);
    },
  }), [currentPeriodId, periodEnded, periodEndDate, periodStartDate, periodStarted]);

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
