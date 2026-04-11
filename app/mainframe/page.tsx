"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FeedGrid } from "@/components/feed/feed-grid";
import type { FeedLog } from "@/components/feed/log-card";

const PAGE_SIZE = 20;

type FeedScope = "global" | "following";

type FeedPage = {
  logs: FeedLog[];
  nextPage: number | null;
};

async function fetchFeedPage(scope: FeedScope, pageParam: number): Promise<FeedPage> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) {
      return { logs: [], nextPage: null };
    }

    try {
      const parsed = JSON.parse(raw) as FeedLog[];
      const sorted = parsed.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
      const start = pageParam * PAGE_SIZE;
      const slice = sorted.slice(start, start + PAGE_SIZE);
      return {
        logs: slice,
        nextPage: slice.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    } catch {
      return { logs: [], nextPage: null };
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { logs: [], nextPage: null };
  }

  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let userId: string | null = null;

  if (scope === "following") {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { logs: [], nextPage: null };
    }
    userId = authData.user.id;
  }

  let followedIds: string[] | null = null;

  if (scope === "following" && userId) {
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", userId);

    if (followsError || !follows || follows.length === 0) {
      return { logs: [], nextPage: null };
    }

    followedIds = follows.map((row) => row.followed_id as string);
  }

  const baseQuery = supabase
    .from("logs")
    .select("id, album_id, album_name, artist_name, cover_url, rating, shelves, review_text, user_id, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: logsData, error: logsError } =
    scope === "following" && followedIds && followedIds.length > 0
      ? await baseQuery.in("user_id", followedIds)
      : await baseQuery;

  if (logsError || !logsData) {
    return { logs: [], nextPage: null };
  }

  const logs = logsData as FeedLog[];

  const uniqueUserIds = Array.from(new Set(logs.map((log) => log.user_id)));

  let usernameById = new Map<string, string>();

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", uniqueUserIds);

    if (!profilesError && profiles) {
      usernameById = new Map(
        profiles.map((p) => [p.id as string, (p.username as string) ?? ""]),
      );
    }
  }

  const enrichedLogs: FeedLog[] = logs.map((log) => ({
    ...log,
    username: usernameById.get(log.user_id) ?? null,
  }));

  return {
    logs: enrichedLogs,
    nextPage: enrichedLogs.length === PAGE_SIZE ? pageParam + 1 : null,
  };
}

export default function MainframePage() {
  const [scope, setScope] = useState<FeedScope>("global");

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FeedPage>({
    queryKey: ["mainframe-feed", scope],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchFeedPage(scope, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    refetchInterval: 30_000,
  });

  const logs = (data?.pages ?? []).flatMap((page) => page.logs);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mainframe</h1>
          <p className="text-sm text-muted-foreground">
            A global pulse of what people are spinning right now.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Button
            type="button"
            size="sm"
            variant={scope === "global" ? "default" : "outline"}
            onClick={() => setScope("global")}
          >
            Global Pulse
          </Button>
          <Button
            type="button"
            size="sm"
            variant={scope === "following" ? "default" : "outline"}
            onClick={() => setScope("following")}
          >
            Following Network
          </Button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading feed…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load feed. Please try again.</p>
      ) : (
        <FeedGrid
          logs={logs}
          hasMore={!!hasNextPage}
          onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
          isLoadingMore={isFetchingNextPage}
        />
      )}
    </div>
  );
}
