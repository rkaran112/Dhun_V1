import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/log/rating-stars";

export type FeedLog = {
  id: string;
  album_id?: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rating: number;
  review_text?: string | null;
  created_at?: string | null;
  shelves: string[];
  user_id: string;
  username?: string | null;
};

type LogCardProps = {
  log: FeedLog;
};

function isNowSpinning(createdAt?: string | null) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  return Date.now() - created <= FIFTEEN_MINUTES;
}

export function LogCard({ log }: LogCardProps) {
  const nowSpinning = isNowSpinning(log.created_at);

  return (
    <Link href={`/log/${log.id}`} prefetch={false}>
      <Card className="flex h-full flex-col gap-2 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative">
          {log.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={log.cover_url}
              alt={log.album_name}
              className="h-48 w-full rounded object-cover"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No cover
            </div>
          )}
          {nowSpinning ? (
            <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-50 shadow">
              Now spinning
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold leading-tight">
                {log.album_name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {log.artist_name}
              </div>
              {log.username ? (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  by <span className="font-medium">@{log.username}</span>
                </div>
              ) : null}
            </div>
            <div className="shrink-0">
              <RatingStars value={log.rating} />
            </div>
          </div>
          {log.review_text ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {log.review_text}
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
