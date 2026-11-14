"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OfficerMenu from "@/components/OfficerMenu";
import { addFarmer, deleteFarmer, fetchFarmers, fetchPlannerOptions, importFarmers } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Farmer, ImportResult } from "@/types/shuka";

const EMPTY = { name: "", phone: "", lga: "", language: "Hausa", crops: "", consent: false };

const CSV_TEMPLATE =
  "name,phone,lga,language,crops\n" +
  "Musa Ibrahim,08031234567,Dawakin Kudu,Hausa,\"millet, beans\"\n" +
  "Aisha Bello,08055554444,Gwale,Hausa,guinea corn\n";

export default function FarmersPage() {
  const session = useSession();
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [languages, setLanguages] = useState<string[]>(["Hausa"]);
  const [form, setForm] = useState(EMPTY);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Not signed in? Go to sign in, then come back here.
  useEffect(() => {
    if (session === null && typeof window !== "undefined") {
      const t = setTimeout(() => {
        if (!localStorage.getItem("shuka.session")) router.replace("/login?next=/farmers");
      }, 50);
      return () => clearTimeout(t);
    }
  }, [session, router]);

  async function reload() {
    try {
      setFarmers(await fetchFarmers());
    } catch {
      // handled by the sign-in redirect
    }
  }

  useEffect(() => {
    if (!session) return;
    fetchFarmers().then(setFarmers).catch(() => {});
    fetchPlannerOptions()
      .then((o) => setLanguages(o.languages))
      .catch(() => {});
  }, [session]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormMsg(null);
    try {
      const f = await addFarmer(form);
      setFormMsg({ ok: true, text: `${f.name} added (${f.phone})` });
      setForm({ ...EMPTY, language: form.language, lga: form.lga });
      reload();
    } catch (err) {
      setFormMsg({ ok: false, text: err instanceof Error ? err.message : "Could not add farmer" });
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    setImportError(null);
    setImportResult(null);
    setBusy(true);
    try {
      const text = await file.text();
      setImportResult(await importFarmers(text));
      reload();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shuka-farmers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(f: Farmer) {
    if (!window.confirm(`Remove ${f.name} (${f.phone})?`)) return;
    try {
      await deleteFarmer(f.id);
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not remove farmer");
    }
  }

  if (!session) {
    return <div className="min-h-screen bg-[#f6f7f4]" />;
  }

  const stateName = session.officer.stateId
    ? session.officer.stateId.charAt(0).toUpperCase() + session.officer.stateId.slice(1)
    : "all states";

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">🌱</div>
          <span className="text-lg font-bold">Shuka</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="hidden text-sm font-semibold text-zinc-600 hover:text-zinc-900 sm:inline">
            Map
          </Link>
          <Link href={`/plan?state=${session.officer.stateId ?? "kano"}`} className="hidden text-sm font-semibold text-zinc-600 hover:text-zinc-900 sm:inline">
            Build advice
          </Link>
          <OfficerMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{stateName}</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Registered farmers</h1>
          <p className="text-sm text-zinc-500">
            <span className="text-2xl font-bold text-zinc-900">{farmers.length}</span> farmers will
            receive advice calls
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Add one farmer */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Add a farmer</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Input label="Phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0803 123 4567" required />
              <Input label="LGA" value={form.lga} onChange={(v) => setForm({ ...form, lga: v })} placeholder="e.g. Dawakin Kudu" />
              <label className="block text-sm">
                <span className="font-medium">Language</span>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                >
                  {languages.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <Input label="Main crops" value={form.crops} onChange={(v) => setForm({ ...form, crops: v })} placeholder="e.g. millet, beans" />
              </div>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                required
                className="mt-0.5"
              />
              The farmer agreed to receive advice calls from Shuka on this number.
            </label>
            {formMsg && (
              <p className={`mt-3 rounded-lg p-3 text-sm ${formMsg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {formMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Add farmer
            </button>
          </form>

          {/* Upload many */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Upload a list (CSV)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              From a cooperative, ADP or association list. Columns are{" "}
              <code className="rounded bg-zinc-100 px-1">name, phone, lga, language, crops</code>. Only
              upload farmers who agreed to receive calls.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {busy ? "Working…" : "Choose CSV file"}
              </button>
              <button
                onClick={downloadTemplate}
                className="rounded-xl border border-zinc-300 px-5 py-2.5 font-semibold hover:border-zinc-400"
              >
                Download template
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            {importError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{importError}</p>}
            {importResult && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
                <p>
                  <span className="font-semibold text-emerald-700">{importResult.added} added</span>
                  {importResult.skipped > 0 && (
                    <span className="font-semibold text-amber-700">, {importResult.skipped} skipped</span>
                  )}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-zinc-600">
                    {importResult.errors.map((e) => (
                      <li key={e.line}>
                        Line {e.line}: {e.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* The list */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {farmers.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">No farmers yet. Add one or upload a list.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">LGA</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Crops</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {farmers.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{f.phone}</td>
                      <td className="px-4 py-3">{f.lga ?? "–"}</td>
                      <td className="px-4 py-3">{f.language}</td>
                      <td className="px-4 py-3">{f.crops ?? "–"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(f)} className="text-xs font-semibold text-red-600 hover:underline">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
