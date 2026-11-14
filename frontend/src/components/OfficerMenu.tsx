"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useSession } from "@/lib/session";

// Top-right corner of every page: "Officer sign in", or the officer's name and links.
export default function OfficerMenu() {
  const session = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <Link href="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
        Officer sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-zinc-500 md:inline">{session.officer.name}</span>
      <Link href="/farmers" className="font-semibold text-zinc-700 hover:text-zinc-900">
        Farmers
      </Link>
      <button
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        className="font-semibold text-zinc-500 hover:text-zinc-900"
      >
        Sign out
      </button>
    </div>
  );
}
