import { buildRatingBuckets, buildGenreSlices } from "@/app/diagnostics/page";

describe("buildRatingBuckets", () => {
  it("rounds ratings to the nearest half-star and counts them", () => {
    const buckets = buildRatingBuckets([
      { rating: 4.2 },
      { rating: 4.4 },
      { rating: 4.6 },
      { rating: 3 },
    ]);

    expect(buckets).toEqual([
      { rating: 3, count: 1 },
      { rating: 4, count: 1 },
      { rating: 4.5, count: 2 },
    ]);
  });

  it("returns an empty array for no logs", () => {
    expect(buildRatingBuckets([])).toEqual([]);
  });
});

describe("buildGenreSlices", () => {
  it("groups by genre when a log has one", () => {
    const slices = buildGenreSlices([
      { genre: "Jazz", shelves: ["listened"] },
      { genre: "jazz", shelves: ["listened"] },
      { genre: "Rock", shelves: ["listened"] },
    ]);

    expect(slices).toEqual([
      { label: "Jazz", count: 1 },
      { label: "jazz", count: 1 },
      { label: "Rock", count: 1 },
    ]);
  });

  it("falls back to the shelf-derived label when genre is missing or blank", () => {
    const slices = buildGenreSlices([
      { genre: null, shelves: ["want to listen"] },
      { genre: "  ", shelves: ["listened"] },
      { genre: undefined, shelves: ["listened"] },
    ]);

    expect(slices).toEqual([
      { label: "Want to listen", count: 1 },
      { label: "Listened", count: 2 },
    ]);
  });
});
