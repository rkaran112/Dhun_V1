import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/log/rating-stars";

export type ProfileLog = {
  id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rating: number;
  shelves: string[];
  created_at?: string | null;
};

type LogsGridProps = {
  logs: ProfileLog[];
};

export function LogsGrid({ logs }: LogsGridProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No logs yet for this user.
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
