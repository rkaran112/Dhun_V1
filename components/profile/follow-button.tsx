"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getFollowStatus, setFollowing } from "@/lib/follows";
import { describeMutationError } from "@/lib/http";

type FollowButtonProps = {
  profileId: string;
};

type State =
  | { kind: "loading" }
  | { kind: "hidden" }
  | { kind: "ready"; viewerId: string; isFollowing: boolean };

export function FollowButton({ profileId }: FollowButtonProps) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setState({ kind: "hidden" });
      return;
    }

    getFollowStatus(supabase, profileId)
      .then((status) => {
        if (cancelled) return;
        if (!status.viewerId || status.viewerId === profileId) {
          setState({ kind: "hidden" });
          return;
        }
        setState({
          kind: "ready",
          viewerId: status.viewerId,
          isFollowing: status.isFollowing,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ kind: "hidden" });
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (state.kind !== "ready") {
    return null;
  }

  const handleClick = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const next = !state.isFollowing;
    setPending(true);
    setError(null);
    try {
      await setFollowing(supabase, state.viewerId, profileId, next);
      setState({ ...state, isFollowing: next });
    } catch (err) {
      setError(
        describeMutationError(
          err,
          next ? "Failed to follow this user." : "Failed to unfollow this user.",
        ),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={state.isFollowing ? "outline" : "default"}
        disabled={pending}
        aria-pressed={state.isFollowing}
        onClick={handleClick}
      >
        {pending ? "Saving…" : state.isFollowing ? "Following" : "Follow"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
