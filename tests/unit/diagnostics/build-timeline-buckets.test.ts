import { buildTimelineBuckets } from "@/app/diagnostics/page";

describe("buildTimelineBuckets", () => {
  it("covers exactly the last 12 months with no gaps, even from a 31-day month", () => {
    // Regression test: setMonth() on a date with day-of-month 31 used to
    // overflow into the following month when the target month was shorter,
    // silently dropping a month from the timeline.
    const now = new Date(2024, 2, 31); // March 31, 2024

    const buckets = buildTimelineBuckets([], now);

    expect(buckets).toHaveLength(12);
    expect(buckets.map((b) => b.label)).toEqual([
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ]);
  });

  it("buckets logs into the month they were created in", () => {
    const now = new Date(2024, 5, 15); // June 15, 2024

    const buckets = buildTimelineBuckets(
      [
        { created_at: "2024-06-01T00:00:00.000Z" },
        { created_at: "2024-06-10T00:00:00.000Z" },
        { created_at: "2024-05-01T00:00:00.000Z" },
      ],
      now,
    );

    const june = buckets.find((b) => b.label === "Jun");
    const may = buckets.find((b) => b.label === "May");

    expect(june?.count).toBe(2);
    expect(may?.count).toBe(1);
  });

  it("ignores logs with a missing or invalid created_at, and logs outside the 12-month window", () => {
    const now = new Date(2024, 5, 15); // June 15, 2024

    const buckets = buildTimelineBuckets(
      [
        { created_at: null },
        { created_at: "not-a-date" },
        { created_at: "2020-01-01T00:00:00.000Z" },
      ],
      now,
    );

    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(0);
  });
});
