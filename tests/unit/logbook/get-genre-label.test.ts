import { getGenreLabel } from "@/app/logbook/page";
import type { DiaryLog } from "@/components/logbook/diary-entry";

function makeLog(overrides: Partial<DiaryLog>): DiaryLog {
  return {
    id: "1",
    album_id: "album-1",
    album_name: "Discovery",
    artist_name: "Daft Punk",
    cover_url: null,
    rating: 4,
    shelves: [],
    review_text: null,
    created_at: null,
    genre: null,
    ...overrides,
  };
}

describe("getGenreLabel", () => {
  it("returns the trimmed genre when present", () => {
    const log = makeLog({ genre: "  Jazz  " });
    expect(getGenreLabel(log)).toBe("Jazz");
  });

  it("falls back to Want to listen when genre is missing and the shelf is want to listen", () => {
    const log = makeLog({ genre: null, shelves: ["want to listen"] });
    expect(getGenreLabel(log)).toBe("Want to listen");
  });

  it("falls back to Listened when genre is missing and the shelf is not want to listen", () => {
    const log = makeLog({ genre: undefined, shelves: ["listened"] });
    expect(getGenreLabel(log)).toBe("Listened");
  });

  it("falls back when genre is an empty or whitespace-only string", () => {
    const log = makeLog({ genre: "   ", shelves: ["listened"] });
    expect(getGenreLabel(log)).toBe("Listened");
  });
});
