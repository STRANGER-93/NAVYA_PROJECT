import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { CreateJournalInput, createJournalEntry, deleteJournalEntry, getJournalEntries, getJournalEntryById, initializeJournalDatabase, JournalEntry, UpdateJournalInput, updateJournalEntry } from "./journalRepository";

type JournalContextValue = { entries: JournalEntry[]; loading: boolean; error: string | null; reload: (query?: string) => Promise<void>; searchEntries: (query: string) => Promise<void>; createEntry: (entry: CreateJournalInput) => Promise<JournalEntry>; updateEntry: (id: string, changes: UpdateJournalInput) => Promise<JournalEntry | null>; deleteEntry: (id: string) => Promise<boolean>; getEntryById: (id: string) => Promise<JournalEntry | null> };
const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async (query = "") => { setLoading(true); setError(null); try { setEntries(await getJournalEntries(query)); } catch (exception) { setError(exception instanceof Error ? exception.message : "Unable to load your journal entries."); } finally { setLoading(false); } }, []);
  useEffect(() => { let active = true; initializeJournalDatabase().then(() => active ? reload() : undefined).catch((exception: unknown) => active && setError(exception instanceof Error ? exception.message : "Unable to initialize private journal storage.")).finally(() => active && setLoading(false)); return () => { active = false; }; }, [reload]);
  const value = useMemo<JournalContextValue>(() => ({ entries, loading, error, reload, searchEntries: reload, createEntry: async (entry) => { const created = await createJournalEntry(entry); await reload(); return created; }, updateEntry: async (id, changes) => { const updated = await updateJournalEntry(id, changes); await reload(); return updated; }, deleteEntry: async (id) => { const deleted = await deleteJournalEntry(id); await reload(); return deleted; }, getEntryById: getJournalEntryById }), [entries, error, loading, reload]);
  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() { const context = React.use(JournalContext); if (!context) throw new Error("useJournal must be used within JournalProvider."); return context; }
