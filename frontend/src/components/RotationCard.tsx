"use client";

import { useState } from "react";
import type { RotationOption, Scores } from "@/types/shuka";

const SCORE_LABELS: { key: keyof Scores; label: string }[] = [
  { key: "water", label: "Water fit" },
  { key: "climate", label: "Climate resilience" },
  { key: "soil", label: "Soil health" },
  { key: "income", label: "Income" },
];

function barColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

interface Props {
  option: RotationOption;
  recommended: boolean;
}

export default function RotationCard({ option: o, recommended }: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
        recommended ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200"
      }`}
    >
      {/* Badges */}
      <div className="flex min-h-6 flex-wrap gap-2">
        {o.isCurrent && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
            Common practice today
          </span>
        )}
        {recommended && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            ★ Recommended
          </span>
        )}
      </div>

      {/* Name and overall score */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold leading-snug">{o.name}</h3>
        <div className="text-right">
          <p className={`text-3xl font-black ${o.overall >= 70 ? "text-emerald-600" : o.overall >= 45 ? "text-amber-600" : "text-red-600"}`}>
            {o.overall}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">out of 100</p>
        </div>
      </div>

      {/* Year 1 / Year 2 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {o.seasons.map((crops, i) => (
          <div key={i} className="rounded-xl bg-[#f6f7f4] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Year {i + 1}</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              {crops.map((c) => c.split(" (")[0]).join(" + ")}
            </p>
          </div>
        ))}
      </div>

      {/* Score bars */}
      <div className="mt-5 space-y-2.5">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600">{label}</span>
              <span className="font-semibold">{o.scores[key]}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className={`h-full rounded-full ${barColor(o.scores[key])}`} style={{ width: `${o.scores[key]}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Why */}
      <p className="mt-5 text-sm leading-relaxed text-zinc-700">{o.why}</p>

      {o.benefits.length > 0 && (
        <List title="Benefits" items={o.benefits} icon="✓" iconClass="text-emerald-600" />
      )}
      {o.risks.length > 0 && <List title="Risks" items={o.risks} icon="!" iconClass="text-amber-600" />}

      {/* Evidence and gaps, hidden until asked */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="mt-4 self-start text-sm font-semibold text-zinc-600 underline-offset-2 hover:underline"
      >
        {showMore ? "Hide evidence" : "Show NASA evidence and data gaps"}
      </button>
      {showMore && (
        <>
          <List title="Evidence" items={o.evidence} icon="•" iconClass="text-blue-600" />
          <List title="What we don't know" items={o.gaps} icon="?" iconClass="text-zinc-400" />
          <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
            {o.checkLocally}
          </p>
        </>
      )}
    </article>
  );
}

function List({ title, items, icon, iconClass }: { title: string; items: string[]; icon: string; iconClass: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-zinc-700">
            <span className={`w-3 shrink-0 font-bold ${iconClass}`}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
