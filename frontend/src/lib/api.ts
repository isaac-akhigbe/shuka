import type {
  DataStatus,
  Farmer,
  ImportResult,
  NewFarmer,
  PlannerOptions,
  Recommendation,
  Session,
  StateProfile,
  StateSummary,
} from "@/types/shuka";
import { getToken, saveSession } from "@/lib/session";

// Where the Python backend lives. Can be changed later with an env variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && withAuth) saveSession(null); // expired, sign out locally
  if (!res.ok) throw new Error(body.detail ?? `API error ${res.status}`);
  return body as T;
}

// ---------- public ----------

export const fetchStates = () => request<StateSummary[]>("/states");

export const fetchStateProfile = (id: string) => request<StateProfile>(`/states/${id}`);

export const fetchPlannerOptions = () => request<PlannerOptions>("/options");

export const fetchDataStatus = () => request<DataStatus>("/data-status");

export const fetchRecommendation = (state: string, current: string, priority: string) =>
  request<Recommendation>(
    `/recommend?state=${state}&current=${encodeURIComponent(current)}&priority=${priority}`
  );

// ---------- officer sign-in ----------

export async function login(username: string, password: string): Promise<Session> {
  const session = await request<Session>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveSession(session);
  return session;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" }, true);
  } finally {
    saveSession(null);
  }
}

// ---------- farmers (signed in) ----------

export const fetchFarmers = () => request<Farmer[]>("/farmers", {}, true);

export const addFarmer = (farmer: NewFarmer) =>
  request<Farmer>("/farmers", { method: "POST", body: JSON.stringify(farmer) }, true);

export const importFarmers = (csv: string) =>
  request<ImportResult>("/farmers/import", { method: "POST", body: JSON.stringify({ csv }) }, true);

export const deleteFarmer = (id: number) =>
  request<{ status: string }>(`/farmers/${id}`, { method: "DELETE" }, true);

export const sendAlert = (stateId: string) =>
  request<{ callId: string; farmers: number }>(`/alert/${stateId}`, { method: "POST" }, true);
