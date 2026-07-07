"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonthDivider } from "@/components/logbook/month-divider";
import { DiaryEntry, type DiaryLog } from "@/components/logbook/diary-entry";

async function fetchLogbookLogs(): Promise<DiaryLog[]> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as DiaryLog[];
      return parsed.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
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
    .select(
      "id, album_id, album_name, artist_name, cover_url, rating, shelves, review_text, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DiaryLog[];
}

async function updateLogOnServer(
  payload: { id: string; rating: number; review_text: string },
): Promise<void> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DiaryLog[];
      const next = parsed.map((log) =>
        log.id === payload.id
          ? { ...log, rating: payload.rating, review_text: payload.review_text }
          : log,
      );
      window.localStorage.setItem("MUSICD_E2E_LOGS", JSON.stringify(next));
    } catch {
      // ignore
    }
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  await supabase
    .from("logs")
    .update({ rating: payload.rating, review_text: payload.review_text })
    .eq("id", payload.id)
    .eq("user_id", user.id);
}

async function deleteLogOnServer(id: string): Promise<void> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DiaryLog[];
      const next = parsed.filter((log) => log.id !== id);
      window.localStorage.setItem("MUSICD_E2E_LOGS", JSON.stringify(next));
    } catch {
      // ignore
    }
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  await supabase.from("logs").delete().eq("id", id).eq("user_id", user.id);
}

export type GroupedLogs = {
  monthLabel: string;
  logs: DiaryLog[];
};

export function groupLogsByMonth(logs: DiaryLog[]): GroupedLogs[] {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  });

  const groups = new Map<string, DiaryLog[]>();

  for (const log of logs) {
    const date = log.created_at ? new Date(log.created_at) : null;
    const key = date && !Number.isNaN(date.getTime()) ? formatter.format(date) : "Unknown";
    const existing = groups.get(key) ?? [];
    existing.push(log);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([monthLabel, groupLogs]) => ({
    monthLabel,
    logs: groupLogs,
  }));
}

export default function LogbookPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState("");
  const highlightedAlbumId = searchParams.get("albumId");
  const genreFilter = searchParams.get("genre");
  const queryClient = useQueryClient();
  const highlightRef = React.useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery<DiaryLog[]>({
    queryKey: ["logbook-logs"],
    queryFn: fetchLogbookLogs,
  });

  const logs = data ?? [];

  const updateMutation = useMutation({
    mutationFn: updateLogOnServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logbook-logs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLogOnServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logbook-logs"] });
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const searched = normalizedSearch
    ? logs.filter((log) => {
        const album = log.album_name.toLowerCase();
        const artist = log.artist_name.toLowerCase();
        return (
          album.includes(normalizedSearch) || artist.includes(normalizedSearch)
        );
      })
    : logs;

  const genreFiltered = genreFilter
    ? searched.filter((log) => {
        if (genreFilter === "Listened") {
          return log.shelves.includes("listened");
        }
        if (genreFilter === "Want to listen") {
          return log.shelves.includes("want to listen");
        }
        return true;
      })
    : searched;

  const grouped = groupLogsByMonth(genreFiltered);

  const highlightedLogId = highlightedAlbumId
    ? genreFiltered.find((log) => log.album_id === highlightedAlbumId)?.id
    : undefined;

  React.useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedLogId]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logbook</h1>
          <p className="text-sm text-muted-foreground">
            Your chronological ledger of every listen.
          </p>
        </div>
        <form
          className="flex w-full max-w-xs items-center gap-2 text-xs"
          onSubmit={(event) => event.preventDefault()}
        >
          <Input
            placeholder="Filter by album or artist…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSearch("")}
            >
              Clear
            </Button>
          ) : null}
        </form>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your logbook…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No logs yet. After you log an album, it will appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.monthLabel} className="space-y-2">
              <MonthDivider label={group.monthLabel} />
              <div className="space-y-3">
                {group.logs.map((log) => {
                  const isHighlighted = highlightedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      ref={isHighlighted ? highlightRef : undefined}
                    >
                      <DiaryEntry
                        log={log}
                        highlight={isHighlighted}
                        onSave={(update) =>
                          updateMutation.mutate({
                            id: log.id,
                            rating: update.rating,
                            review_text: update.review_text,
                          })
                        }
                        onDelete={() => deleteMutation.mutate(log.id)}
                        isSaving={updateMutation.isPending}
                        isDeleting={deleteMutation.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
