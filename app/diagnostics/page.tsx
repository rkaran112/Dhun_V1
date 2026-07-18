"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { RatingDistribution } from "@/components/diagnostics/rating-distribution";
import { GenrePie } from "@/components/diagnostics/genre-pie";
import { TimelineGraph } from "@/components/diagnostics/timeline-graph";

export type DiagnosticsPayload = {
  ratingBuckets: { rating: number; count: number }[];
  genreSlices: { label: string; count: number }[];
  timelinePoints: { label: string; count: number }[];
};

type TimelineLog = { created_at: string | null };

export function buildTimelineBuckets(
  logs: TimelineLog[],
  now: Date = new Date(),
): { label: string; count: number }[] {
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  type TimelineBucket = { key: string; label: string; count: number };

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
  });

  const timelineBuckets: TimelineBucket[] = [];

  for (let i = 0; i < 12; i += 1) {
    const date = new Date(
      twelveMonthsAgo.getFullYear(),
      twelveMonthsAgo.getMonth() + i,
      1,
    );
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = formatter.format(date).slice(0, 3);
    timelineBuckets.push({ key, label, count: 0 });
  }

  for (const log of logs) {
    if (!log.created_at) continue;
    const created = new Date(log.created_at);
    if (Number.isNaN(created.getTime())) continue;
    if (created < twelveMonthsAgo || created > now) continue;

    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const bucket = timelineBuckets.find((b) => b.key === key);
    if (bucket) {
      bucket.count += 1;
    }
  }

  return timelineBuckets.map(({ label, count }) => ({ label, count }));
}

async function fetchDiagnostics(): Promise<DiagnosticsPayload> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  type RawLog = {
    rating: number;
    shelves: string[];
    created_at: string | null;
    genre?: string | null;
  };

  let logs: RawLog[] = [];

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as RawLog[];
        logs = parsed;
      } catch {
        logs = [];
      }
    }
  } else {
    const supabase = getSupabaseClient();
    if (!supabase) return { ratingBuckets: [], genreSlices: [], timelinePoints: [] };

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ratingBuckets: [], genreSlices: [], timelinePoints: [] };
    }

    const { data, error } = await supabase
      .from("logs")
      .select("rating, shelves, created_at, genre")
      .eq("user_id", user.id);

    if (!error && data) {
      logs = data as RawLog[];
    }
  }

  const ratingBucketsMap = new Map<number, number>();

  for (const log of logs) {
    const step = Math.round(log.rating * 2) / 2;
    const current = ratingBucketsMap.get(step) ?? 0;
    ratingBucketsMap.set(step, current + 1);
  }

  const ratingBuckets = Array.from(ratingBucketsMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  const genreMap = new Map<string, number>();

  for (const log of logs) {
    const primaryGenre = log.genre?.trim();
    const label =
      primaryGenre && primaryGenre.length > 0
        ? primaryGenre
        : log.shelves.includes("want to listen")
          ? "Want to listen"
          : "Listened";
    const current = genreMap.get(label) ?? 0;
    genreMap.set(label, current + 1);
  }

  const genreSlices = Array.from(genreMap.entries()).map(([label, count]) => ({
    label,
    count,
  }));

  const timelinePoints = buildTimelineBuckets(logs);

  return {
    ratingBuckets,
    genreSlices,
    timelinePoints,
  };
}

export default function DiagnosticsPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery<DiagnosticsPayload>({
    queryKey: ["diagnostics"],
    queryFn: fetchDiagnostics,
  });

  const payload = data ?? {
    ratingBuckets: [],
    genreSlices: [],
    timelinePoints: [],
  };

  const handleSelectGenre = (label: string) => {
    const encoded = encodeURIComponent(label);
    router.push(`/logbook?genre=${encoded}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Diagnostics</h1>
        <p className="text-sm text-muted-foreground">
          A read-only dashboard of your listening patterns.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading diagnostics…</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-3">
          <RatingDistribution buckets={payload.ratingBuckets} />
        </Card>
        <Card className="p-3">
          <GenrePie slices={payload.genreSlices} onSelectGenre={handleSelectGenre} />
        </Card>
      </section>

      <section>
        <Card className="p-3">
          <TimelineGraph points={payload.timelinePoints} />
        </Card>
      </section>
    </div>
  );
}
