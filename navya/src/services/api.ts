import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const localApiUrl = Platform.OS === "android" ? "http://10.0.2.2:8000/api/v1" : "http://127.0.0.1:8000/api/v1";
const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? localApiUrl).replace(/\/$/, "");
const sessionKey = "navya.session";
type StoredSession = { accessToken?: string; refreshToken?: string; access_token?: string; refresh_token?: string; setupCompleted?: boolean; setup_completed?: boolean };

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

let refreshInFlight: Promise<string | null> | null = null;

async function readSession(): Promise<StoredSession | null> {
  const saved = await SecureStore.getItemAsync(sessionKey);
  if (!saved) return null;
  try { return JSON.parse(saved) as StoredSession; } catch { await SecureStore.deleteItemAsync(sessionKey); return null; }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const saved = await readSession(); const refreshToken = saved?.refreshToken ?? saved?.refresh_token;
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }) });
      if (!response.ok) { await SecureStore.deleteItemAsync(sessionKey); return null; }
      const next = await response.json() as { access_token: string; refresh_token: string; setup_completed: boolean };
      await SecureStore.setItemAsync(sessionKey, JSON.stringify({ accessToken: next.access_token, refreshToken: next.refresh_token, setupCompleted: next.setup_completed }));
      return next.access_token;
    } catch { return null; }
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60_000);
  try { return await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } }); }
  catch { throw new ApiError("Could not reach NAVYA. Check that the backend is running and that this device is on the same Wi-Fi network.", 0); }
  finally { clearTimeout(timeout); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const saved = await readSession(); let response = await send(path, init, saved?.accessToken ?? saved?.access_token ?? null);
  const isAuthenticationRoute = path.startsWith("/auth/");
  if (response.status === 401 && !isAuthenticationRoute) {
    const freshToken = await refreshAccessToken();
    if (freshToken) response = await send(path, init, freshToken);
  }
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new ApiError(body.detail ?? "Request failed", response.status); }
  return response.status === 204 ? undefined as T : response.json();
}

export const api = { get: <T>(path: string) => request<T>(path), post: <T>(path: string, body?: object) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }), put: <T>(path: string, body: object) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }), patch: <T>(path: string, body: object) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }), delete: <T>(path: string) => request<T>(path, { method: "DELETE" }) };
