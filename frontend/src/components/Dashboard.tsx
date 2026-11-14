"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchDataStatus, fetchStateProfile, fetchStates } from "@/lib/api";
import { RISK_STYLES } from "@/lib/risk";
import type { StateProfile, StateSummary } from "@/types/shuka";
import StatePanel from "@/components/StatePanel";
import OfficerMenu from "@/components/OfficerMenu";

// Leaflet needs the browser's "window", so the map must only load in the browser
const RiskMap = dynamic(() => import("@/components/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-200" />,
});

export default function Dashboard() {
  const [states, setStates] = useState<StateSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataDay, setDataDay] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  // Load the map data once when the page opens
  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch(() => setError("Can't reach the Shuka backend. Is uvicorn running on port 8000?"));
    fetchDataStatus()
      .then((s) => setDataDay(s.latestDataDay))
      .catch(() => {});
  }, []);

  async function select(id: string) {
    setSelectedId(id);
    setLoadingProfile(true);
    try {
      setProfile(await fetchStateProfile(id));
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
    // On mobile the panel sits under the map, so scroll down to it
    if (window.innerWidth < 1024) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const ranked = [...states].sort((a, b) => b.falseOnsetRate - a.falseOnsetRate);
  const highRisk = states.filter((s) => s.riskLevel !== "low").length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f4] text-zinc-900 lg:h-screen">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">
            🌱
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Shuka</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">Know what to plant. Know when to plant.</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <OfficerMenu />
          {dataDay && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              ● NASA data to {new Date(dataDay).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          <Link
            href="/plan"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Build advice
          </Link>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-3 border-b border-zinc-200 bg-white text-center sm:text-left">
        <Stat label="States analysed" value={states.length || "–"} />
        <Stat label="With frequent false starts" value={states.length ? highRisk : "–"} accent="text-red-600" />
        <Stat label="Days of NASA data" value={states.length ? "196k" : "–"} />
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Map + panel. Stacked on mobile, side by side on large screens */}
      <main className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <section className="h-[55vh] lg:h-auto lg:flex-1">
          <RiskMap locations={states} selectedId={selectedId} onSelect={select} />
        </section>

        <aside
          ref={panelRef}
          className="border-t border-zinc-200 bg-white p-5 sm:p-6 lg:w-[440px] lg:overflow-y-auto lg:border-l lg:border-t-0"
        >
          {loadingProfile ? (
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
              <div className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
              <div className="h-20 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          ) : profile && selectedId ? (
            <StatePanel
              profile={profile}
              onClose={() => {
                setSelectedId(null);
                setProfile(null);
              }}
            />
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Most false starts, 2000 to 2026
              </p>
              <ul className="mt-4 space-y-2">
                {ranked.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => select(s.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className={`text-sm font-semibold ${RISK_STYLES[s.riskLevel].text}`}>
                        {s.falseOnsetYears} of {s.yearsAnalysed} seasons
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-zinc-500">
                Tap any state to see its climate profile from NASA satellite data, then plan a crop
                rotation that fits it.
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="border-r border-zinc-200 px-3 py-3 last:border-r-0 sm:px-6">
      <p className={`text-xl font-bold sm:text-2xl ${accent ?? ""}`}>{value}</p>
      <p className="text-[11px] text-zinc-500 sm:text-xs">{label}</p>
    </div>
  );
}
