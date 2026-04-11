"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/log/rating-stars";
import { insertLogSchema, shelfEnum } from "@/lib/validation/logs";

type Album = {
  id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
};

type AlbumLogDialogProps = {
  album: Album;
  disabled?: boolean;
};

const logFormSchema = insertLogSchema.pick({
  rating: true,
  shelves: true,
  review_text: true,
});

type LogFormState = z.infer<typeof logFormSchema>;

export function AlbumLogDialog({ album, disabled }: AlbumLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LogFormState>({
    rating: 4.0,
    shelves: ["listened"],
    review_text: "",
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: LogFormState) => {
      const supabase = getSupabaseClient();
      const isTestMode =
        typeof window !== "undefined" &&
        window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

      if (!supabase && isTestMode) {
        const parsed = logFormSchema.parse(values);

        const newLog = {
          id: `test-${Date.now()}`,
          album_id: album.id,
          album_name: album.album_name,
          artist_name: album.artist_name,
          cover_url: album.cover_url,
          rating: parsed.rating,
          shelves: parsed.shelves,
          review_text: parsed.review_text ?? "",
          created_at: new Date().toISOString(),
        };

        const existingRaw = window.localStorage.getItem("MUSICD_E2E_LOGS");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        window.localStorage.setItem(
          "MUSICD_E2E_LOGS",
          JSON.stringify([newLog, ...existing]),
        );

        return newLog;
      }

      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to log an album.");
      }

      const parsed = logFormSchema.parse(values);

      const payload = {
        album_id: album.id,
        album_name: album.album_name,
        artist_name: album.artist_name,
        cover_url: album.cover_url,
        rating: parsed.rating,
        shelves: parsed.shelves,
        review_text: parsed.review_text ?? "",
        user_id: user.id,
      };

      const { error: insertError } = await supabase.from("logs").insert(payload);

      if (insertError) {
        throw new Error(insertError.message);
      }

      return payload;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
      setOpen(false);

      if (created && typeof window !== "undefined") {
        const albumId = (created as { album_id?: string }).album_id;
        if (albumId) {
          router.push(`/logbook?albumId=${encodeURIComponent(albumId)}`);
        }
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to save log. Please try again.";
      setError(message);
    },
  });

  const toggleShelf = (shelf: (typeof shelfEnum.enumValues)[number]) => {
    setForm((current) => {
      const exists = current.shelves.includes(shelf);
      if (exists) {
        return {
          ...current,
          shelves: current.shelves.filter((s) => s !== shelf),
        };
      }
      return {
        ...current,
        shelves: [...current.shelves, shelf],
      };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
      >
        Log
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log this album</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="flex items-center gap-4 p-3">
            {album.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.cover_url}
                alt={album.album_name}
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                No cover
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">
                {album.album_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {album.artist_name}
              </span>
            </div>
          </Card>

          <div className="space-y-1">
            <label className="text-sm font-medium">Rating</label>
            <RatingStars
              value={form.rating}
              onChange={(rating) =>
                setForm((current) => ({ ...current, rating }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Shelves</label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  form.shelves.includes("listened") ? "default" : "outline"
                }
                onClick={() => toggleShelf("listened")}
              >
                Listened
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  form.shelves.includes("want to listen")
                    ? "default"
                    : "outline"
                }
                onClick={() => toggleShelf("want to listen")}
              >
                Want to listen
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="review" className="text-sm font-medium">
              Review (optional)
            </label>
            <Input
              id="review"
              placeholder="What did you think?"
              value={form.review_text ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  review_text: event.target.value,
                }))
              }
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
