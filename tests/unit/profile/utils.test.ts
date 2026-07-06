import { filterLogs } from "@/app/(profile)/[username]/utils";
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
