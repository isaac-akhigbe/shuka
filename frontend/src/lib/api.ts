import type { LocationRisk } from "@/types/location";

// Where the Python backend lives. Can be changed later with an env variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchLocations(): Promise<LocationRisk[]> {
  const res = await fetch(`${API_URL}/locations`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function sendAlert(locationId: string): Promise<{ callId: string }> {
  const res = await fetch(`${API_URL}/alert/${locationId}`, { method: "POST" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail ?? `API error ${res.status}`);
  return body;
}