import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { MoodId, moodConfigurations } from "../mood/moodRepository";

export type JournalSource = "journal" | "mood";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  source: JournalSource;
  mood: MoodId | null;
  moodLabel: string | null;
  moodEmoji: string | null;
  moodSubtitle: string | null;
  isPrivate: true;
  createdAt: string;
  updatedAt: string;
};

export type CreateJournalInput = {
  title: string;
  content: string;
  source: JournalSource;
  mood?: MoodId | null;
  moodLabel?: string | null;
  moodEmoji?: string | null;
  moodSubtitle?: string | null;
};

export type UpdateJournalInput = Pick<CreateJournalInput, "title" | "content">;

type JournalRow = {
  id: string;
  title: string;
  body: string;
  source: JournalSource;
  mood_key: MoodId | null;
  mood_label: string | null;
  mood_emoji: string | null;
  mood_subtitle: string | null;
  created_at: string;
  updated_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) databasePromise = initializeDatabase();
  return databasePromise;
}

async function initializeDatabase() {
  const database = await SQLite.openDatabaseAsync("journal.db");
  await database.execAsync("PRAGMA journal_mode = WAL;");
  await database.execAsync("PRAGMA foreign_keys = ON;");
  const versionRow = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
  const version = versionRow?.user_version ?? 0;

  if (version < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('journal', 'mood')),
        mood_key TEXT,
        mood_label TEXT,
        mood_emoji TEXT,
        mood_subtitle TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
      PRAGMA user_version = 1;
    `);
  }

  if (__DEV__) console.info("Journal database initialized");
  return database;
}

function mapRow(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.body,
    source: row.source,
    mood: row.mood_key,
    moodLabel: row.mood_label,
    moodEmoji: row.mood_emoji,
    moodSubtitle: row.mood_subtitle,
    isPrivate: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function reportError(operation: string, error: unknown) {
  if (__DEV__) console.warn(`Journal ${operation} failed`, error instanceof Error ? error.message : "Unknown error");
}

export async function initializeJournalDatabase() {
  await getDatabase();
}

export async function getJournalEntries(query = ""): Promise<JournalEntry[]> {
  try {
    const database = await getDatabase();
    const normalizedQuery = query.trim();
    const rows = normalizedQuery
      ? await database.getAllAsync<JournalRow>("SELECT * FROM journal_entries WHERE LOWER(title) LIKE LOWER(?) OR LOWER(body) LIKE LOWER(?) OR LOWER(COALESCE(mood_label, '')) LIKE LOWER(?) ORDER BY created_at DESC", [`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`])
      : await database.getAllAsync<JournalRow>("SELECT * FROM journal_entries ORDER BY created_at DESC");
    if (__DEV__) console.info("Journal entries loaded", rows.length);
    return rows.map(mapRow);
  } catch (error) {
    reportError("query", error);
    throw new Error("Unable to load your journal entries.");
  }
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync<JournalRow>("SELECT * FROM journal_entries WHERE id = ?", [id]);
    return row ? mapRow(row) : null;
  } catch (error) {
    reportError("entry query", error);
    throw new Error("Unable to load this journal entry.");
  }
}

export async function createJournalEntry(input: CreateJournalInput): Promise<JournalEntry> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) throw new Error("Add a title and your journal entry before saving.");
  const now = new Date().toISOString();
  const moodConfig = input.mood ? moodConfigurations[input.mood] : null;
  const entry: JournalEntry = {
    id: Crypto.randomUUID(), title, content, source: input.source, mood: input.source === "mood" ? input.mood ?? null : null,
    moodLabel: input.source === "mood" ? input.moodLabel ?? moodConfig?.label ?? null : null,
    moodEmoji: input.source === "mood" ? input.moodEmoji ?? moodConfig?.emoji ?? null : null,
    moodSubtitle: input.source === "mood" ? input.moodSubtitle ?? (moodConfig ? `You logged ${moodConfig.label}` : null) : null,
    isPrivate: true, createdAt: now, updatedAt: now,
  };
  try {
    const database = await getDatabase();
    await database.runAsync("INSERT INTO journal_entries (id, title, body, source, mood_key, mood_label, mood_emoji, mood_subtitle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [entry.id, entry.title, entry.content, entry.source, entry.mood, entry.moodLabel, entry.moodEmoji, entry.moodSubtitle, entry.createdAt, entry.updatedAt]);
    if (__DEV__) console.info("Journal entry created", entry.id);
    return entry;
  } catch (error) {
    reportError("create", error);
    throw new Error("Unable to save your journal entry. Please try again.");
  }
}

export async function updateJournalEntry(id: string, input: UpdateJournalInput): Promise<JournalEntry | null> {
  const title = input.title.trim(); const content = input.content.trim();
  if (!title || !content) throw new Error("Add a title and your journal entry before saving.");
  try {
    const database = await getDatabase(); const updatedAt = new Date().toISOString();
    const result = await database.runAsync("UPDATE journal_entries SET title = ?, body = ?, updated_at = ? WHERE id = ?", [title, content, updatedAt, id]);
    if (!result.changes) return null;
    if (__DEV__) console.info("Journal entry updated", id);
    return getJournalEntryById(id);
  } catch (error) {
    reportError("update", error);
    throw new Error("Unable to update this journal entry. Please try again.");
  }
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  try {
    const database = await getDatabase(); const result = await database.runAsync("DELETE FROM journal_entries WHERE id = ?", [id]);
    if (__DEV__) console.info("Journal entry deleted", id);
    return result.changes > 0;
  } catch (error) {
    reportError("delete", error);
    throw new Error("Unable to delete this journal entry. Please try again.");
  }
}

export const getMoodEmoji = (mood: MoodId | null) => mood ? moodConfigurations[mood]?.emoji ?? null : null;
export const getMoodLabel = (mood: MoodId | null) => mood ? moodConfigurations[mood]?.label ?? null : null;
export const formatEntryDateTime = (iso: string) => { const date = new Date(iso); return `${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })} · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`; };
