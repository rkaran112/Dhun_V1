import { ZodError } from "zod";
import { describeSearchError } from "@/lib/spotify/search-error";
import { albumSearchSchema } from "@/lib/validation/search";

describe("describeSearchError", () => {
  it("returns the field validation message and a 400 status for a ZodError", () => {
    let caught: unknown;
    try {
      albumSearchSchema.parse({ q: "a" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ZodError);
    expect(describeSearchError(caught)).toEqual({
      message: "Search query must be at least 2 characters",
      status: 400,
    });
  });

  it("falls back to a generic message and a 502 status for non-validation errors", () => {
    expect(describeSearchError(new Error("Spotify search failed: {...}"))).toEqual({
      message: "Failed to search Spotify. Please try again.",
      status: 502,
    });
  });

  it("falls back to a generic message and a 502 status for non-Error values", () => {
    expect(describeSearchError("boom")).toEqual({
      message: "Failed to search Spotify. Please try again.",
      status: 502,
    });
  });
});
