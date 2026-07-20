import { buildTimelineGrid } from "@/components/diagnostics/timeline-graph";

describe("buildTimelineGrid", () => {
  it("leaves the column blank for a month with zero logs", () => {
    // Regression test: the fill loop used to run once even when a point's
    // count was 0, drawing a bottom-row bar for months with no activity at
    // all, indistinguishable from a month with genuinely low activity.
    const grid = buildTimelineGrid([
      { label: "Jan", count: 0 },
      { label: "Feb", count: 10 },
    ]);

    const janColumn = grid.map((row) => row[0]);
    expect(janColumn.every((cell) => cell === " ")).toBe(true);
  });

  it("fills the bottom cell for a month with nonzero logs", () => {
    const grid = buildTimelineGrid([{ label: "Jan", count: 5 }]);

    const bottomRow = grid[grid.length - 1];
    expect(bottomRow[0]).toBe("#");
  });

  it("leaves every column blank when all counts are zero", () => {
    const grid = buildTimelineGrid([
      { label: "Jan", count: 0 },
      { label: "Feb", count: 0 },
    ]);

    expect(grid.every((row) => row.every((cell) => cell === " "))).toBe(true);
  });
});
