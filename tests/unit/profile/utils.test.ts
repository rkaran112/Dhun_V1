import { computeStats, filterLogs } from "@/app/(profile)/[username]/utils";
import { ProfileLog } from "@/components/profile/logs-grid";

function makeLog(overrides: Partial<ProfileLog>): ProfileLog {
  return {
    id: "1",
    album_name: "Discovery",
    artist_name: "Daft Punk",
    cover_url: null,
    rating: 4,
    shelves: [],
    ...overrides,
  };
}

describe("filterLogs", () => {
  const logs = [
    makeLog({ id: "1", shelves: ["listened"] }),
    makeLog({ id: "2", shelves: ["want to listen"] }),
    makeLog({ id: "3", shelves: ["listened", "want to listen"] }),
  ];

  it("returns all logs when shelf is 'all'", () => {
    expect(filterLogs(logs, "all")).toEqual(logs);
  });

  it("returns only logs on the listened shelf", () => {
    const result = filterLogs(logs, "listened");
    expect(result.map((log) => log.id)).toEqual(["1", "3"]);
  });

  it("returns only logs on the want-to-listen shelf", () => {
    const result = filterLogs(logs, "want-to-listen");
    expect(result.map((log) => log.id)).toEqual(["2", "3"]);
  });

  it("returns an empty array when no logs match", () => {
    expect(filterLogs([], "listened")).toEqual([]);
  });
});

describe("computeStats", () => {
  it("returns a null average rating for an empty list", () => {
    expect(computeStats([])).toEqual({
      totalLogs: 0,
      averageRating: null,
      listenedCount: 0,
      wantToListenCount: 0,
    });
  });

  it("averages ratings and counts each shelf independently", () => {
    const logs = [
      makeLog({ id: "1", rating: 5, shelves: ["listened"] }),
      makeLog({ id: "2", rating: 3, shelves: ["want to listen"] }),
      makeLog({ id: "3", rating: 4, shelves: ["listened", "want to listen"] }),
    ];

    expect(computeStats(logs)).toEqual({
      totalLogs: 3,
      averageRating: 4,
      listenedCount: 2,
      wantToListenCount: 2,
    });
  });

  it("counts a log on both shelves toward both counters", () => {
    const logs = [makeLog({ shelves: ["listened", "want to listen"] })];
    const stats = computeStats(logs);
    expect(stats.listenedCount).toBe(1);
    expect(stats.wantToListenCount).toBe(1);
  });
});
