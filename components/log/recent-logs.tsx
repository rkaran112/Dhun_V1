"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/log/rating-stars";

type RecentLog = {
  id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rating: number;
  shelves: string[];
  created_at?: string | null;
};

type RecentLogsProps = {
  isAuthenticated: boolean;
};

async function fetchRecentLogs(): Promise<RecentLog[]> {
  const isTestMode =
    typeof window !== "undefined" &&
    window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("MUSICD_E2E_LOGS")
        : null;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as RecentLog[];
      return parsed;
    } catch {
      return [];
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("logs")
    .select("id, album_name, artist_name, cover_url, rating, shelves, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data as RecentLog[];
}

export function RecentLogs({ isAuthenticated }: RecentLogsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: fetchRecentLogs,
  });

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to see your recent activity.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading recent activity…</p>
    );
  }

  const logs = data ?? [];

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No logs yet. After you save a log, it will appear here.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {logs.map((log) => (
        <Card key={log.id} className="flex flex-col gap-2 p-3">
          {log.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={log.cover_url}
              alt={log.album_name}
              className="h-40 w-full rounded object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <div className="flex flex-1 flex-col justify-between gap-1">
            <div>
              <div className="text-sm font-medium leading-tight">
                {log.album_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {log.artist_name}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <RatingStars value={log.rating} />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {log.shelves.join(", ")}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
