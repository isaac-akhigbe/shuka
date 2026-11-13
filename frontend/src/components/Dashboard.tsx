"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { mockLocations } from "../data/Mocklocations";
import { RISK_STYLES } from "@/lib/risk";
import { fetchLocations } from "@/lib/api";
import type { LocationRisk } from "@/types/location";
import SidePanel from "@/components/SidePanel";

// Leaflet needs the browser's "window", so the map must only load in the browser
const RiskMap = dynamic(() => import("@/components/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-200" />,
});

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Start with mock data so the page never looks empty,
  // then replace it with data from the backend if the backend is running
  const [locations, setLocations] = useState<LocationRisk[]>(mockLocations);
  const [source, setSource] = useState<"api" | "mock">("mock");

  useEffect(() => {
    fetchLocations()
      .then((data) => {
        setLocations(data);
        setSource("api");
      })
      .catch(() => console.warn("Backend not reachable, showing mock data"));
  }, []);

  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const highRisk = locations.filter((l) => l.riskLevel === "high");
  const totalFarmers = locations.reduce((sum, l) => sum + l.farmersRegistered, 0);
  const topRisk = [...locations].sort((a, b) => b.riskPercent - a.riskPercent).slice(0, 5);

  function select(id: string) {
    setSelectedId(id);
    // On mobile the panel sits under the map, so scroll down to it
    if (window.innerWidth < 1024) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f4] text-zinc-900 lg:h-screen">
      {/* Header */}
      <header className="flex bg-white flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">
            🌱
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Shuka</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">
              NASA Earth observation turned into planting decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              source === "api"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {source === "api" ? "● Live API" : "● Demo data"}
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Powered by NASA POWER
          </span>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-3 border-b bg-white border-zinc-200 text-center sm:text-left">
        <Stat label="States monitored" value={locations.length} />
        <Stat label="High risk" value={highRisk.length} accent="text-red-600" />
        <Stat label="Farmers covered" value={totalFarmers.toLocaleString()} />
      </div>

      {/* Map + panel. Stacked on mobile, side by side on large screens */}
      <main className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <section className="h-[55vh] lg:h-auto lg:flex-1">
          <RiskMap locations={locations} selectedId={selectedId} onSelect={select} />
        </section>

        <aside
          ref={panelRef}
          className="border-t border-zinc-200 bg-white p-5 sm:p-6 lg:w-[420px] lg:overflow-y-auto lg:border-l lg:border-t-0"
        >
          {selected ? (
            <SidePanel
              key={selected.id}
              location={selected}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Highest risk right now
              </p>
              <ul className="mt-4 space-y-2">
                {topRisk.map((loc) => (
                  <li key={loc.id}>
                    <button
                      onClick={() => select(loc.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className={`font-bold ${RISK_STYLES[loc.riskLevel].text}`}>
                        {loc.riskPercent}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-zinc-500">
                Tap any state on the map to see its rainfall and planting verdict.
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