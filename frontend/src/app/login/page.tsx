"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { demoLogin, fetchPlannerOptions, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Only show the demo button if the backend has demo mode switched on
  useEffect(() => {
    fetchPlannerOptions()
      .then((o) => setDemoMode(o.demoMode))
      .catch(() => {});
  }, []);

  function goNext() {
    // Go back to where the officer came from (e.g. ?next=/plan?state=kano), or to Farmers
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") ? next : "/farmers");
  }

  async function handleDemo() {
    setBusy(true);
    setError(null);
    try {
      await demoLogin();
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the demo");
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f4] px-4 text-zinc-900">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-xl">🌱</span>
        <span className="text-xl font-bold">Shuka</span>
      </Link>

      {demoMode && (
        <div className="mb-4 w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-sm font-semibold text-emerald-900">Judging or exploring Shuka?</p>
          <button
            type="button"
            onClick={handleDemo}
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Starting demo…" : "Try the demo as Kano officer →"}
          </button>
          <p className="mt-2 text-xs text-emerald-800">
            Or sign in below with <span className="font-mono">kano.officer</span> /{" "}
            <span className="font-mono">shuka2026</span>
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h1 className="text-xl font-bold">Extension officer sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage farmers and send advice in your area.</p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5"
        />

        <label className="mt-4 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5"
        />

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">
          No account? Ask your state ADP coordinator to add you.
        </p>
      </form>

      <Link href="/dashboard" className="mt-6 text-sm text-zinc-500 hover:text-zinc-800">
        ← Back to the public map
      </Link>
    </div>
  );
}
