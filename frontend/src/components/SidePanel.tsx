"use client";

import { useState } from "react";
import type { LocationRisk } from "@/types/location";
import { RISK_STYLES } from "@/lib/risk";
import RainChart from "@/components/RainChart";
import { sendAlert } from "@/lib/api";

type CallState = "idle" | "calling" | "sent" | "failed";

interface Props {
  location: LocationRisk;
  onClose: () => void;
}

export default function SidePanel({ location, onClose }: Props) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const style = RISK_STYLES[location.riskLevel];
  const isWait = location.verdict === "wait";

  // Asks the backend to place the call. The backend talks to Twilio.
  async function handleSend() {
    setCallState("calling");
    setError(null);
    try {
      await sendAlert(location.id);
      setCallState("sent");
    } catch (err) {
      setCallState("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {location.name} State
          </p>
          <h2 className="text-3xl font-bold">{location.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Verdict, the most important thing on the screen */}
      <div className={`rounded-2xl border ${style.border} ${style.bg} p-5`}>
        <p className={`text-xs font-semibold uppercase tracking-widest ${style.text}`}>
          Planting verdict
        </p>
        <p className={`mt-1 text-4xl font-black tracking-tight ${style.text}`}>
          {isWait ? "WAIT" : "PLANT"}
        </p>
        <p className="mt-2 text-sm text-zinc-700">{location.verdictMessage}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <p className="text-xs text-zinc-500">False onset risk</p>
          <p className={`mt-1 text-3xl font-bold ${style.text}`}>{location.riskPercent}%</p>
          <p className="mt-1 text-xs text-zinc-500">
            {location.falseOnsetYears} of {location.yearsAnalysed} years
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <p className="text-xs text-zinc-500">Farmers registered</p>
          <p className="mt-1 text-3xl font-bold">{location.farmersRegistered}</p>
          <p className="mt-1 text-xs text-zinc-500">Hausa voice line</p>
        </div>
      </div>

      {/* Rainfall chart */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Last 30 days of rainfall</p>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            NASA POWER
          </span>
        </div>
        <RainChart data={location.last30DaysRain} color={style.color} />
      </div>

      {/* Call to action */}
      <button
        onClick={handleSend}
        disabled={callState === "calling" || callState === "sent"}
        className={`w-full rounded-xl px-5 py-4 text-base font-semibold transition
          ${callState === "sent"
            ? "bg-emerald-600 text-white"
            : "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-70"}`}
      >
        {callState === "idle" && `Send voice alert to ${location.farmersRegistered} farmers`}
        {callState === "calling" && "Calling farmers…"}
        {callState === "sent" && "✓ Phone is ringing"}
        {callState === "failed" && "Try again"}
      </button>
      {error && <p className="-mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}