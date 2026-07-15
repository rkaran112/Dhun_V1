import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/log/rating-stars";
import { Textarea } from "@/components/ui/textarea";

export type DiaryLog = {
  id: string;
  album_id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rating: number;
  shelves: string[];
  review_text: string | null;
  created_at: string | null;
  genre?: string | null;
};

type DiaryEntryProps = {
  log: DiaryLog;
  onSave: (update: { rating: number; review_text: string }) => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  highlight?: boolean;
};

export function DiaryEntry({
  log,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  highlight,
}: DiaryEntryProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftRating, setDraftRating] = React.useState(log.rating);
  const [draftReview, setDraftReview] = React.useState(log.review_text ?? "");

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

  const handleSave = () => {
    onSave({ rating: draftRating, review_text: draftReview });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Delete this entry? This cannot be undone.")) {
      onDelete();
    }
  };

  return (
    <Card
      className={
        "flex flex-col gap-3 border-l-4 bg-background px-4 py-3 transition-shadow " +
        (highlight ? "border-l-emerald-500 shadow-lg" : "border-l-transparent")
      }
    >
      <div className="flex items-start gap-4">
        {log.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={log.cover_url}
            alt={log.album_name}
            className="mt-1 h-16 w-16 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
            No cover
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold leading-tight">
                {log.album_name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {log.artist_name}
              </div>
              {createdLabel ? (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {createdLabel}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={isEditing ? "Cancel edit" : "Edit entry"}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-60"
                aria-label="Delete entry"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <RatingStars
              value={draftRating}
              onChange={isEditing ? setDraftRating : undefined}
            />
            {isEditing ? (
              <Textarea
                value={draftReview}
                onChange={(event) => setDraftReview(event.target.value)}
                className="max-h-48 min-h-20 text-xs"
                placeholder="What did you think?"
              />
            ) : (
              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {log.review_text && log.review_text.trim().length > 0
                  ? log.review_text
                  : "No written review yet."}
              </p>
            )}
          </div>

          {isEditing ? (
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setDraftRating(log.rating);
                  setDraftReview(log.review_text ?? "");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
