import { albumSearchSchema } from "@/lib/validation/search";

describe("albumSearchSchema", () => {
  it("accepts a valid query", () => {
    const result = albumSearchSchema.parse({ q: "Discovery" });
    expect(result.q).toBe("Discovery");
  });

  it("rejects short queries", () => {
    expect(() => albumSearchSchema.parse({ q: "a" })).toThrow();
  });
});
