"use client";

import { useEffect, useState } from "react";
import {
  approveBriefing,
  fetchAgentContext,
  fetchLatestBriefing,
  generateBriefing,
  saveBriefing,
} from "@/lib/api";
import type { Briefing, BriefingContent } from "@/types/shuka";

interface Props {
  stateId: string;
  stateName: string;
  current: string;
  priority: string;
}

const LANGUAGES = ["English", "Hausa"];

export default function BriefingPanel({ stateId, stateName, current, priority }: Props) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [draft, setDraft] = useState<BriefingContent | null>(null);
  const [language, setLanguage] = useState("English");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);

  // Show the latest briefing for this state when the panel opens or the state changes
  useEffect(() => {
    let cancelled = false;
    fetchLatestBriefing(stateId)
      .then((b) => {
        if (cancelled) return;
        setBriefing(b);
        setDraft(b ? b.content : null);
        setContext(null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  const edited = briefing && draft && JSON.stringify(draft) !== JSON.stringify(briefing.content);

  async function run(label: string, fn: () => Promise<Briefing>) {
    setBusy(label);
    setError(null);
    try {
      const b = await fn();
      setBriefing(b);
      setDraft(b.content);
      setContext(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function toggleContext() {
    if (context) return setContext(null);
    try {
      setContext(JSON.stringify(await fetchAgentContext(stateId), null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load agent context");
    }
  }

  const set = (patch: Partial<BriefingContent>) => draft && setDraft({ ...draft, ...patch });

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header and generate controls */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">AI briefing</p>
          <h2 className="mt-1 text-lg font-bold">Farmer briefing for {stateName}</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600">
            AI turns the advice above into plain language and likely farmer questions. Facts come only
            from Shuka&apos;s NASA analysis. Review and approve it, and a future call agent uses it to talk
            with farmers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button
            onClick={() => run("generate", () => generateBriefing(stateId, current, priority, language))}
            disabled={!!busy}
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {busy === "generate" ? "Writing with AI…" : briefing ? "✨ Regenerate" : "✨ Generate briefing"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {briefing && draft && (
        <div className="mt-5">
          {/* Status line */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {briefing.status === "approved" ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                ✓ Approved by {briefing.approvedBy}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                Draft, needs officer approval
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
              {briefing.source === "ai" ? "Written by AI" : "Template (AI unavailable)"} · {briefing.language}
            </span>
            {briefing.needsReview && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">
                New NASA data since this was written
              </span>
            )}
          </div>

          {briefing.unverifiedNumbers.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              ⚠ Check these numbers before approving. They are not in Shuka&apos;s data:{" "}
              <strong>{briefing.unverifiedNumbers.join(", ")}</strong>
            </p>
          )}

          {briefing.riskyTopics.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              ⚠ The farmer text mentions topics the agent should leave to you:{" "}
              <strong>{briefing.riskyTopics.join(", ")}</strong>. Check the wording before approving.
            </p>
          )}

          {/* Officer summary */}
          <div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm leading-relaxed text-violet-950">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Summary for you</p>
            <p className="mt-1">{draft.officerSummary}</p>
          </div>

          {/* Editable farmer-facing text */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Area label="Opening message (said first on every call)" value={draft.keyMessage} onChange={(v) => set({ keyMessage: v })} />
            <Area label="When to plant" value={draft.plantingAdvice} onChange={(v) => set({ plantingAdvice: v })} />
            <Area label="Recommended rotation, explained" value={draft.recommendationExplained} onChange={(v) => set({ recommendationExplained: v })} />
            <Area
              label="Warnings (one per line)"
              value={draft.warnings.join("\n")}
              onChange={(v) => set({ warnings: v.split("\n").filter((x) => x.trim()) })}
            />
          </div>

          {/* FAQ */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Questions farmers may ask
          </p>
          <div className="mt-2 space-y-3">
            {draft.faq.map((qa, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 p-3">
                <p className="text-sm font-semibold">{qa.question}</p>
                <textarea
                  value={qa.answer}
                  onChange={(e) =>
                    set({ faq: draft.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })
                  }
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Hand-over rules */}
          <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm">
            <p className="font-semibold">The agent never answers these. It refers farmers to you:</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-zinc-600">
              {briefing.handOverTopics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {edited && (
              <button
                onClick={() => run("save", () => saveBriefing(briefing.id, draft))}
                disabled={!!busy}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-zinc-400 disabled:opacity-60"
              >
                {busy === "save" ? "Saving…" : "Save changes"}
              </button>
            )}
            {briefing.status !== "approved" && (
              <button
                onClick={() => run("approve", () => approveBriefing(briefing.id))}
                disabled={!!busy || !!edited}
                title={edited ? "Save your changes first" : ""}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === "approve" ? "Approving…" : "✓ Approve for call agent"}
              </button>
            )}
            {briefing.status === "approved" && (
              <button
                onClick={toggleContext}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-zinc-400"
              >
                {context ? "Hide agent context" : "View agent context"}
              </button>
            )}
          </div>

          {context && (
            <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
              {context}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 leading-relaxed"
      />
    </label>
  );
}
