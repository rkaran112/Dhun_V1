import { FeedLog, LogCard } from "@/components/feed/log-card";

export type FeedGridProps = {
  logs: FeedLog[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
};

export function FeedGrid({ logs, onLoadMore, hasMore, isLoadingMore }: FeedGridProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet. Once people start logging albums, they will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {logs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>
      {onLoadMore && hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoadingMore ? "Loading more…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
