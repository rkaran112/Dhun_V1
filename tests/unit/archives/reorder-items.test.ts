import { reorderItems } from "@/app/archives/page";

type RankedListItem = Parameters<typeof reorderItems>[0][number];

function makeItem(overrides: Partial<RankedListItem>): RankedListItem {
  return {
    id: "1",
    list_id: "list-1",
    album_id: "album-1",
    album_name: "Discovery",
    artist_name: "Daft Punk",
    cover_url: null,
    rank: 1,
    ...overrides,
  };
}

describe("reorderItems", () => {
  const items = [
    makeItem({ id: "a", rank: 1 }),
    makeItem({ id: "b", rank: 2 }),
    makeItem({ id: "c", rank: 3 }),
  ];

  it("moves an item down and renumbers ranks sequentially", () => {
    const result = reorderItems(items, "a", "c");
    expect(result.map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(result.map((item) => item.rank)).toEqual([1, 2, 3]);
  });

  it("moves an item up and renumbers ranks sequentially", () => {
    const result = reorderItems(items, "c", "a");
    expect(result.map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(result.map((item) => item.rank)).toEqual([1, 2, 3]);
  });

  it("returns the original array unchanged when the active id is missing", () => {
    const result = reorderItems(items, "missing", "b");
    expect(result).toBe(items);
  });

  it("returns the original array unchanged when the target id is missing", () => {
    const result = reorderItems(items, "a", "missing");
    expect(result).toBe(items);
  });
});
