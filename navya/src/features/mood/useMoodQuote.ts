import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../services/api";
import { MoodId } from "./moodRepository";

type MoodQuote = { id: string; mood: MoodId; quote: string };
type QuoteState = { quote: string | null; loading: boolean; error: string | null; empty: boolean; offline: boolean };

const quoteCache = new Map<MoodId, MoodQuote>();
const requests = new Map<MoodId, Promise<MoodQuote>>();

async function fetchQuote(mood: MoodId, force = false): Promise<MoodQuote> {
  if (!force && quoteCache.has(mood)) return quoteCache.get(mood)!;
  if (!force && requests.has(mood)) return requests.get(mood)!;
  const request = api.get<MoodQuote>(`/moods/${mood}/quote`).then((quote) => { quoteCache.set(mood, quote); return quote; }).finally(() => { requests.delete(mood); });
  requests.set(mood, request);
  return request;
}

export function useMoodQuote(mood: MoodId) {
  const cached = quoteCache.get(mood);
  const [state, setState] = useState<QuoteState>({ quote: cached?.quote ?? null, loading: !cached, error: null, empty: false, offline: false });
  const load = useCallback(async (force = false) => {
    const available = quoteCache.get(mood);
    if (available && !force) { setState({ quote: available.quote, loading: false, error: null, empty: false, offline: false }); return; }
    setState((current) => ({ ...current, loading: true, error: null, empty: false, offline: false }));
    try { const quote = await fetchQuote(mood, force); setState({ quote: quote.quote, loading: false, error: null, empty: false, offline: false }); }
    catch (error) {
      const cachedQuote = quoteCache.get(mood)?.quote ?? null;
      if (cachedQuote) { setState({ quote: cachedQuote, loading: false, error: null, empty: false, offline: false }); return; }
      if (error instanceof ApiError && error.status === 404) setState({ quote: null, loading: false, error: null, empty: true, offline: false });
      else if (error instanceof ApiError && error.status === 0) setState({ quote: null, loading: false, error: null, empty: false, offline: true });
      else setState({ quote: null, loading: false, error: "Unable to load a quote right now.", empty: false, offline: false });
    }
  }, [mood]);
  useEffect(() => { void load(); }, [load]);
  return { ...state, refresh: () => load(true) };
}
