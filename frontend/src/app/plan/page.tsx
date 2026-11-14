import type { Metadata } from "next";
import { Suspense } from "react";
import Planner from "@/components/Planner";

export const metadata: Metadata = {
  title: "Plan a rotation · Shuka",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Reading ?state=kano happens per request, so it sits inside <Suspense>
async function PlannerFromUrl({ searchParams }: { searchParams: SearchParams }) {
  const { state } = await searchParams;
  return <Planner initialState={typeof state === "string" ? state : "kano"} />;
}

// The map links here as /plan?state=kano
export default function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f4]" />}>
      <PlannerFromUrl searchParams={searchParams} />
    </Suspense>
  );
}
