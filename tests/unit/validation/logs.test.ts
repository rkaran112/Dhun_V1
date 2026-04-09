import { insertLogSchema } from "@/lib/validation/logs";

describe("insertLogSchema", () => {
  const base = {
    album_id: "1",
    album_name: "Discovery",
    artist_name: "Daft Punk",
    cover_url: "https://example.com/cover.jpg",
    shelves: ["listened"],
    review_text: "Great album!",
  } as const;

  it("accepts a valid payload", () => {
    const result = insertLogSchema.parse({
      ...base,
      rating: 4.5,
    });
    expect(result.rating).toBe(4.5);
  });

  it("rejects rating below 0.5", () => {
    expect(() =>
      insertLogSchema.parse({
        ...base,
        rating: 0.25,
      }),
    ).toThrow();
  });

  it("rejects rating above 5", () => {
    expect(() =>
      insertLogSchema.parse({
        ...base,
        rating: 5.5,
      }),
    ).toThrow();
  });

  it("rejects rating not in 0.5 increments", () => {
    expect(() =>
      insertLogSchema.parse({
        ...base,
        rating: 4.3,
      }),
    ).toThrow();
  });

  it("requires at least one shelf", () => {
    expect(() =>
      insertLogSchema.parse({
        ...base,
        shelves: [],
        rating: 4,
      }),
    ).toThrow();
  });
});
