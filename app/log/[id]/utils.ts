export type LogDetail = {
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

type RawLogRow = {
  id: string;
  album_id?: string | null;
  album_name?: string | null;
  artist_name?: string | null;
  cover_url?: string | null;
  rating?: number | string | null;
  shelves?: unknown;
  review_text?: string | null;
  user_id: string;
  created_at?: string | null;
};

/**
 * Normalizes a raw `logs` row into a shape the detail page can render
 * without crashing on nullable columns (e.g. a null `shelves` array or a
 * null `rating`).
 */
export function normalizeLogDetail(
  row: RawLogRow,
  username: string | null,
): LogDetail {
  const numericRating = Number(row.rating);
  const shelves = Array.isArray(row.shelves)
    ? row.shelves.filter(
        (shelf): shelf is string =>
          typeof shelf === "string" && shelf.trim().length > 0,
      )
    : [];

  return {
    id: row.id,
    album_id: row.album_id ?? "",
    album_name: row.album_name ?? "Unknown album",
    artist_name: row.artist_name ?? "Unknown artist",
    cover_url: row.cover_url ?? null,
    rating: Number.isFinite(numericRating) ? numericRating : 0,
    shelves,
    review_text: row.review_text ?? null,
    user_id: row.user_id,
    created_at: row.created_at ?? null,
    username,
  };
}
