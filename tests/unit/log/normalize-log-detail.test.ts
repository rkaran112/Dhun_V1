import { normalizeLogDetail } from "@/app/log/[id]/utils";

const baseRow = {
  id: "log-1",
  album_id: "album-1",
  album_name: "Discovery",
  artist_name: "Daft Punk",
  cover_url: "https://example.com/cover.jpg",
  rating: 4.5,
  shelves: ["listened"],
  review_text: "Great record",
  user_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
};

describe("normalizeLogDetail", () => {
  it("passes through a fully populated row and attaches the username", () => {
    expect(normalizeLogDetail(baseRow, "karan")).toEqual({
      ...baseRow,
      username: "karan",
    });
  });

  it("defaults a null shelves column to an empty array", () => {
    const result = normalizeLogDetail({ ...baseRow, shelves: null }, null);
    expect(result.shelves).toEqual([]);
  });

  it("drops non-string and blank shelf entries", () => {
    const result = normalizeLogDetail(
      { ...baseRow, shelves: ["listened", "", "  ", 3, null, "favorites"] },
      null,
    );
    expect(result.shelves).toEqual(["listened", "favorites"]);
  });

  it("defaults a null or non-numeric rating to 0", () => {
    expect(normalizeLogDetail({ ...baseRow, rating: null }, null).rating).toBe(0);
    expect(
      normalizeLogDetail({ ...baseRow, rating: "not-a-number" }, null).rating,
    ).toBe(0);
  });

  it("coerces numeric-string ratings returned by Postgres numeric columns", () => {
    expect(normalizeLogDetail({ ...baseRow, rating: "3.5" }, null).rating).toBe(
      3.5,
    );
  });

  it("fills placeholder names when album or artist names are missing", () => {
    const result = normalizeLogDetail(
      { ...baseRow, album_name: null, artist_name: null, album_id: null },
      null,
    );
    expect(result.album_name).toBe("Unknown album");
    expect(result.artist_name).toBe("Unknown artist");
    expect(result.album_id).toBe("");
  });
});
