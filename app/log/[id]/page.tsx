import { notFound } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/log/rating-stars";
import Link from "next/link";

async function getLogById(id: string) {
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("logs")
    .select("id, album_id, album_name, artist_name, cover_url, rating, shelves, review_text, user_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", data.user_id)
    .maybeSingle();

  return {
    ...data,
    username: profile?.username ?? null,
  } as {
    id: string;
    album_id: string;
    album_name: string;
    artist_name: string;
    cover_url: string | null;
    rating: number;
    shelves: string[];
    review_text: string | null;
    user_id: string;
    created_at: string | null;
    username: string | null;
  };
}

type LogDetailPageProps = {
  params: { id: string };
};

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  const id = decodeURIComponent(params.id);
  const log = await getLogById(id);

  if (!log) {
    notFound();
  }

  const created = log.created_at ? new Date(log.created_at) : null;
  const createdLabel = created && !Number.isNaN(created.getTime())
    ? created.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Log detail</h1>
          {log.username ? (
            <p className="text-sm text-muted-foreground">
              by <span className="font-medium">@{log.username}</span>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={log.album_id ? `/logbook?albumId=${encodeURIComponent(log.album_id)}` : "/logbook"}
            className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            View in logbook
          </Link>
        </div>
      </header>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {log.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={log.cover_url}
              alt={log.album_name}
              className="h-40 w-40 rounded object-cover"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <h2 className="text-xl font-semibold leading-tight">
                {log.album_name}
              </h2>
              <p className="text-sm text-muted-foreground">{log.artist_name}</p>
            </div>
            {createdLabel ? (
              <p className="text-xs text-muted-foreground">{createdLabel}</p>
            ) : null}
            <div className="mt-2">
              <RatingStars value={log.rating} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {log.review_text && log.review_text.trim().length > 0
                ? log.review_text
                : "No written review for this log."}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Shelves: {log.shelves.join(", ")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
