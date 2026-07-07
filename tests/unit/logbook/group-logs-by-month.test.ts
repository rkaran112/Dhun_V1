import { groupLogsByMonth } from "@/app/logbook/page";
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
    ...overrides,
  };
}

describe("groupLogsByMonth", () => {
  it("groups logs by month and year", () => {
    const logs = [
      makeLog({ id: "1", created_at: "2024-03-05T12:00:00.000Z" }),
      makeLog({ id: "2", created_at: "2024-03-20T12:00:00.000Z" }),
      makeLog({ id: "3", created_at: "2024-04-01T12:00:00.000Z" }),
    ];

    const grouped = groupLogsByMonth(logs);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].logs.map((log) => log.id)).toEqual(["1", "2"]);
    expect(grouped[1].logs.map((log) => log.id)).toEqual(["3"]);
  });

  it("buckets logs with a missing or invalid created_at under Unknown", () => {
    const logs = [
      makeLog({ id: "1", created_at: null }),
      makeLog({ id: "2", created_at: "not-a-date" }),
    ];

    const grouped = groupLogsByMonth(logs);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].monthLabel).toBe("Unknown");
    expect(grouped[0].logs.map((log) => log.id)).toEqual(["1", "2"]);
  });

  it("returns an empty array when there are no logs", () => {
    expect(groupLogsByMonth([])).toEqual([]);
  });
});
