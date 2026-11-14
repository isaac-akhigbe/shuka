"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPlannerOptions, fetchRecommendation, fetchStates, sendAlert } from "@/lib/api";
import { RISK_STYLES } from "@/lib/risk";
import type { PlannerOptions, Recommendation, StateSummary } from "@/types/shuka";
import RotationCard from "@/components/RotationCard";
import OfficerMenu from "@/components/OfficerMenu";
import { useSession } from "@/lib/session";

type CallState = "idle" | "calling" | "sent" | "failed";

export default function Planner({ initialState }: { initialState: string }) {
  const [states, setStates] = useState<StateSummary[]>([]);
  const [options, setOptions] = useState<PlannerOptions | null>(null);
  const [stateId, setStateId] = useState(initialState);
  const [current, setCurrent] = useState("maize-maize");
  const [priority, setPriority] = useState("balanced");
  const [result, setResult] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callError, setCallError] = useState<string | null>(null);
  const session = useSession();

  // Load the dropdown choices once
  useEffect(() => {
    Promise.all([fetchStates(), fetchPlannerOptions()])
      .then(([s, o]) => {
        setStates(s);
        setOptions(o);
      })
      .catch(() => setError("Can't reach the Shuka backend. Is uvicorn running on port 8000?"));
  }, []);

  // Ask the backend again whenever the farmer changes an answer
  useEffect(() => {
    let cancelled = false;
    fetchRecommendation(stateId, current, priority)
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setError(null);
          setCallState("idle");
        }
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [stateId, current, priority]);

  async function handleCall() {
    setCallState("calling");
    setCallError(null);
    try {
      await sendAlert(stateId);
      setCallState("sent");
    } catch (err) {
      setCallState("failed");
      setCallError(err instanceof Error ? err.message : "Call failed");
    }
  }

  const best = result?.options.find((o) => o.id === result.recommendedId);
  const farmerCount = states.find((s) => s.id === stateId)?.farmerCount ?? 0;
  const canSend = session && (session.officer.role === "admin" || session.officer.stateId === stateId);
  const planting = result?.planting;

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">🌱</div>
          <span className="text-lg font-bold">Shuka</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
            ← Map
          </Link>
          <OfficerMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          For extension officers
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Build advice for farmers in an area</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Choose the state you cover and what most farmers there grow today. Shuka compares that
          practice with two alternatives, using 26 years of NASA climate data, then sends the advice
          to farmers by phone.
        </p>

        {/* The three questions */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-3">
          <Field label="1. Which state are you advising?">
            <select
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="2. What do most farmers there plant now?">
            <select
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
            >
              {options?.currentRotations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="3. What do they need most?">
            <div className="flex flex-wrap gap-2">
              {options?.priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    priority === p.id
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white hover:border-zinc-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {result && planting && best && (
          <>
            {/* Summary and timing */}
            <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl bg-emerald-700 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
                  Recommended advice for {result.state.name}
                </p>
                {best.isCurrent ? (
                  <>
                    <p className="mt-2 text-2xl font-bold">Keep {best.name.toLowerCase()}</p>
                    <p className="mt-2 text-emerald-100">
                      Today&apos;s common practice already fits this climate better than the
                      alternatives. Focus advice on planting time and early-maturing seed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-2xl font-bold">Switch to {best.name.toLowerCase()}</p>
                    <p className="mt-2 text-emerald-100">{best.why}</p>
                  </>
                )}
              </div>
              <div className={`rounded-2xl border p-6 ${RISK_STYLES[planting.riskLevel].border} ${RISK_STYLES[planting.riskLevel].bg}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${RISK_STYLES[planting.riskLevel].text}`}>
                  When to plant
                </p>
                <p className="mt-2 text-xl font-bold">
                  From {planting.safePlantingFrom}
                </p>
                <p className="text-sm text-zinc-600">Most years by {planting.safePlantingBy}</p>
                <p className="mt-2 text-sm text-zinc-700">{planting.advice}</p>
              </div>
            </div>

            {/* Three options side by side */}
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {result.options.map((o) => (
                <RotationCard key={o.id} option={o} recommended={o.id === result.recommendedId} />
              ))}
            </div>

            {/* Voice call */}
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">Send this advice to farmers in {result.state.name}</p>
                <p className="text-sm text-zinc-500">
                  {farmerCount} registered farmer{farmerCount === 1 ? "" : "s"} · a short voice call in
                  their language, on any basic phone. Demo mode calls one verified phone.
                </p>
                {callError && <p className="mt-1 text-sm text-red-600">{callError}</p>}
              </div>
              {!session ? (
                <Link
                  href={`/login?next=${encodeURIComponent(`/plan?state=${stateId}`)}`}
                  className="rounded-xl border border-zinc-300 px-5 py-3 font-semibold hover:border-zinc-400"
                >
                  Officer sign in to send
                </Link>
              ) : !canSend ? (
                <p className="text-sm text-zinc-500">You can only send to farmers in your own state.</p>
              ) : farmerCount === 0 ? (
                <Link href="/farmers" className="rounded-xl border border-zinc-300 px-5 py-3 font-semibold hover:border-zinc-400">
                  Add farmers first
                </Link>
              ) : (
                <button
                  onClick={handleCall}
                  disabled={callState === "calling" || callState === "sent"}
                  className={`rounded-xl px-5 py-3 font-semibold text-white transition ${
                    callState === "sent" ? "bg-emerald-600" : "bg-zinc-900 hover:bg-zinc-800 disabled:opacity-70"
                  }`}
                >
                  {callState === "idle" && `📞 Send to ${farmerCount} farmer${farmerCount === 1 ? "" : "s"}`}
                  {callState === "calling" && "Calling…"}
                  {callState === "sent" && "✓ Phone is ringing"}
                  {callState === "failed" && "Try again"}
                </button>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">{result.disclaimer}</p>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}
