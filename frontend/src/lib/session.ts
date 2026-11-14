"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Session } from "@/types/shuka";

// The signed-in officer is kept in the browser so a refresh doesn't sign them out.
const KEY = "shuka.session";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore, the officer just won't stay signed in after refresh
  }
  listeners.forEach((fn) => fn());
}

export function getToken(): string | null {
  const raw = read();
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as Session).token;
  } catch {
    return null;
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn); // other tabs signing in or out
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

/** The current session, or null if nobody is signed in. Re-renders on sign in/out. */
export function useSession(): Session | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }, [raw]);
}
