import React, { createContext, useEffect, useMemo, useState } from "react";
import { MoodId } from "./moodRepository";
import { api } from "../../services/api";

export type SavedMood = { id: string; mood: MoodId; loggedAt: Date };
type MoodHistoryContextValue = { loggedMood: MoodId | null; savedMoods: SavedMood[]; logMood: (mood: MoodId) => void };
const MoodHistoryContext = createContext<MoodHistoryContextValue | null>(null);

export function MoodHistoryProvider({ children }: { children: React.ReactNode }) {
  const [loggedMood, setLoggedMood] = useState<MoodId | null>(null);
  const [savedMoods, setSavedMoods] = useState<SavedMood[]>([]);
  useEffect(() => { let active = true; void api.get<{ id: string; mood: MoodId; logged_at: string }[]>("/moods").then((records) => { if (!active) return; const saved = records.map((record) => ({ id: record.id, mood: record.mood, loggedAt: new Date(record.logged_at) })); setSavedMoods(saved); setLoggedMood(saved[0]?.mood ?? null); }).catch(() => undefined); return () => { active = false; }; }, []);
  const value = useMemo(() => ({ loggedMood, savedMoods, logMood: (mood: MoodId) => { void api.post<{ id: string; mood: MoodId; logged_at: string }>("/moods", { mood }).then((record) => { const saved = { id: record.id, mood: record.mood, loggedAt: new Date(record.logged_at) }; setSavedMoods((current) => [saved, ...current]); setLoggedMood(mood); }).catch(() => undefined); } }), [loggedMood, savedMoods]);
  return <MoodHistoryContext.Provider value={value}>{children}</MoodHistoryContext.Provider>;
}

export function useMoodHistory() {
  const context = React.use(MoodHistoryContext);
  if (!context) throw new Error("useMoodHistory must be used within MoodHistoryProvider.");
  return context;
}
