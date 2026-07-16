import { isNowSpinning } from "@/components/feed/log-card";

describe("isNowSpinning", () => {
  const NOW = new Date("2024-01-01T12:00:00.000Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns false when createdAt is missing", () => {
    expect(isNowSpinning(null)).toBe(false);
    expect(isNowSpinning(undefined)).toBe(false);
  });

  it("returns false when createdAt is not a valid date", () => {
    expect(isNowSpinning("not-a-date")).toBe(false);
  });

  it("returns true when logged within the last 15 minutes", () => {
    const createdAt = new Date(NOW - 5 * 60 * 1000).toISOString();
    expect(isNowSpinning(createdAt)).toBe(true);
  });

  it("returns true right at the 15 minute boundary", () => {
    const createdAt = new Date(NOW - 15 * 60 * 1000).toISOString();
    expect(isNowSpinning(createdAt)).toBe(true);
  });

  it("returns false once older than 15 minutes", () => {
    const createdAt = new Date(NOW - 15 * 60 * 1000 - 1).toISOString();
    expect(isNowSpinning(createdAt)).toBe(false);
  });
});
