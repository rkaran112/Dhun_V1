type ProfileHeaderProps = {
  username: string;
  totalLogs: number;
  averageRating: number | null;
  listenedCount: number;
  wantToListenCount: number;
};

export function ProfileHeader({
  username,
  totalLogs,
  averageRating,
  listenedCount,
  wantToListenCount,
}: ProfileHeaderProps) {
  return (
    <header className="mb-4 space-y-2 border-b pb-4">
      <h1 className="text-2xl font-semibold tracking-tight">@{username}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="font-medium text-foreground">{totalLogs}</strong> logs
        </span>
        <span>
          Avg rating:{" "}
          <strong className="font-medium text-foreground">
            {averageRating !== null ? averageRating.toFixed(1) : "–"}
          </strong>
        </span>
        <span>
          Listened: {listenedCount} • Want to listen: {wantToListenCount}
        </span>
      </div>
    </header>
  );
}
