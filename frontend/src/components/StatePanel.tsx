"use client";

import Link from "next/link";
import type { StateProfile } from "@/types/shuka";
import { RISK_STYLES } from "@/lib/risk";
import RainChart from "@/components/RainChart";
import SeasonHistory from "@/components/SeasonHistory";

interface Props {
  profile: StateProfile;
  onClose: () => void;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function StatePanel({ profile: p, onClose }: Props) {
  const style = RISK_STYLES[p.riskLevel];
  const t = p.trend;
  const gettingWorse = t.falseOnsetRateLate - t.falseOnsetRateEarly >= 0.1;

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Climate profile · NASA POWER {p.firstYear} to {p.lastYear}
          </p>
          <h2 className="text-3xl font-bold">{p.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Headline finding */}
      <div className={`rounded-2xl border ${style.border} ${style.bg} p-5`}>
        <p className={`text-xs font-semibold uppercase tracking-widest ${style.text}`}>
          {style.label}
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-zinc-900">
          The first rains were a false start in {p.falseOnsetYears} of {p.yearsAnalysed} seasons.
        </p>
        {gettingWorse && (
          <p className="mt-2 text-sm text-zinc-700">
            It is getting more common. {pct(t.falseOnsetRateEarly)} of seasons up to {t.splitYear},{" "}
            <span className="font-semibold text-red-600">{pct(t.falseOnsetRateLate)} since</span>.
          </p>
        )}
      </div>

      {/* Season by season */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold">Every season since {p.firstYear}</p>
        <SeasonHistory seasons={p.seasons} excludedYears={p.excludedYears} />
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3">
        <Fact label="Safe to plant from" value={p.safePlantingFrom} note={`Most years by ${p.safePlantingBy}`} />
        <Fact label="Growing season" value={`${p.seasonLengthMedian} days`} note={`${p.seasonLengthDryYear} in a dry year`} />
        <Fact label="Rain, Apr to Oct" value={`${p.seasonalRainMean} mm`} note={`${p.seasonalRainDryYear} mm in a dry year`} />
        <Fact label="Very hot days (35°C+)" value={`${p.heatDaysMean}`} note="per growing season" />
        <Fact label="Registered farmers" value={`${p.farmerCount}`} note="receive advice calls" wide />
      </div>

      {/* Latest season chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Daily rain, April to July {p.lastYear}</p>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            NASA POWER
          </span>
        </div>
        <RainChart data={p.latestSeasonRain} color={style.color} />
      </div>

      {p.excludedYears.length > 0 && (
        <p className="text-xs leading-relaxed text-zinc-500">
          Left out for data quality: {p.excludedYears.join(", ")}. NASA&apos;s rainfall for these
          years has values that are physically impossible, so we don&apos;t use them.
        </p>
      )}

      {/* Next step */}
      <Link
        href={`/plan?state=${p.id}`}
        className="w-full rounded-xl bg-zinc-900 px-5 py-4 text-center text-base font-semibold text-white transition hover:bg-zinc-800"
      >
        🌱 Build advice for farmers in {p.name} →
      </Link>
    </div>
  );
}

function Fact({ label, value, note, wide }: { label: string; value: string; note: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ${wide ? "col-span-2" : ""}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{note}</p>
    </div>
  );
}
