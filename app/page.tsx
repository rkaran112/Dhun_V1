"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AlbumSearch } from "@/components/log/album-search";
import { RecentLogs } from "@/components/log/recent-logs";

type SessionUser = {
  id: string;
  email?: string;
  display_name?: string;
  username?: string;
};

function useAuthUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple test-mode bypass for E2E tests where Supabase isn't configured.
  const testUser = useMemo<SessionUser | null>(() => {
    if (typeof window === "undefined") return null;
    if (window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true") {
      return {
        id: "test-user-id",
        email: "test@example.com",
        display_name: "Test User",
      };
    }
    return null;
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (testUser) {
      setUser(testUser);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        console.error("Error fetching Supabase user", error.message);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const baseUsername = `u_${data.user.id.replace(/-/g, "").slice(0, 12)}`;
      const avatarUrl = (data.user.user_metadata as { avatar_url?: string })
        ?.avatar_url;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              username: baseUsername,
              avatar_url: avatarUrl ?? null,
            },
            { onConflict: "id" },
          )
          .select("username")
          .single();

        if (profileError) {
          console.error("Error syncing profile", profileError.message);
        }

        setUser({
          id: data.user.id,
          email: data.user.email ?? undefined,
          display_name:
            (data.user.user_metadata as { full_name?: string })?.full_name ??
            undefined,
          username: profileData?.username ?? baseUsername,
        });
      } catch (profileSyncError) {
        if (profileSyncError instanceof Error) {
          console.error("Profile sync error", profileSyncError.message);
        }
        setUser({
          id: data.user.id,
          email: data.user.email ?? undefined,
          display_name:
            (data.user.user_metadata as { full_name?: string })?.full_name ??
            undefined,
          username: baseUsername,
        });
      } finally {
        setLoading(false);
      }
    });
  }, [testUser]);

  return { user, loading } as const;
}

async function signInWithSpotify() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    alert(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
    return;
  }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}`
      : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo,
    },
  });

  if (error) {
    alert(`Spotify sign-in failed: ${error.message}`);
  }
}

export default function HomePage() {
  const { user, loading } = useAuthUser();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight">Musicd</span>
            <span className="text-xs text-muted-foreground">
              Log what you listen to. Like Letterboxd, for albums.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-muted-foreground">Loading…</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Signed in
                  {user.display_name ? ` as ${user.display_name}` : ""}
                </span>
                {user.username ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${user.username}`}>View profile</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <Button size="sm" onClick={signInWithSpotify}>
                Sign in with Spotify
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <section>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">
            Log an album
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Search Spotify, pick an album, rate it, and add it to your
            shelves.
          </p>
          <AlbumSearch isAuthenticated={!!user} />
        </section>
        <section className="mt-4 border-t pt-4">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            Recent activity
          </h2>
          <RecentLogs isAuthenticated={!!user} />
        </section>
      </main>
    </div>
  );
}

