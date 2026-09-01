import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { clearCyclePredictionCache } from "../cycle/predictionRepository";

type Session = { accessToken: string; refreshToken: string; setupCompleted: boolean };
type AuthValue = { session: Session | null; loading: boolean; signIn: (email: string, password: string) => Promise<Session>; signUp: (fullName: string, email: string, password: string) => Promise<Session>; updateSetupState: (completed: boolean) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
const key = "navya.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { SecureStore.getItemAsync(key).then((value) => value && setSession(JSON.parse(value))).finally(() => setLoading(false)); }, []);
  const persist = useCallback(async (next: Session | null) => { clearCyclePredictionCache(); setSession(next); if (next) await SecureStore.setItemAsync(key, JSON.stringify(next)); else await SecureStore.deleteItemAsync(key); }, []);
  const authenticate = useCallback(async (path: string, body: object) => { const response = await api.post<{ access_token: string; refresh_token: string; setup_completed: boolean }>(path, body); const next = { accessToken: response.access_token, refreshToken: response.refresh_token, setupCompleted: response.setup_completed }; await persist(next); return next; }, [persist]);
  const value = useMemo<AuthValue>(() => ({ session, loading, signIn: (email, password) => authenticate("/auth/login", { email, password }), signUp: (fullName, email, password) => authenticate("/auth/register", { full_name: fullName, email, password, accepted_terms: true }), updateSetupState: async (completed) => { if (session) await persist({ ...session, setupCompleted: completed }); }, signOut: async () => { if (session) { try { await api.post("/auth/logout", { refresh_token: session.refreshToken }); } catch {} } await persist(null); } }), [authenticate, loading, persist, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = React.use(AuthContext); if (!value) throw new Error("useAuth must be used within AuthProvider"); return value; }
