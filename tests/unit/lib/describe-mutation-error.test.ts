import { z } from "zod";
import { describeMutationError } from "@/lib/http";

describe("describeMutationError", () => {
  it("uses the first issue message from a ZodError instead of the raw issues JSON", () => {
    const schema = z.object({ shelves: z.array(z.string()).min(1, "Select at least one shelf") });
    const result = schema.safeParse({ shelves: [] });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(describeMutationError(result.error, "Failed to save.")).toBe(
      "Select at least one shelf",
    );
  });

  it("uses the message of a plain Error", () => {
    expect(describeMutationError(new Error("Network down"), "Failed to save.")).toBe(
      "Network down",
    );
  });

  it("falls back for non-Error values", () => {
    expect(describeMutationError("oops", "Failed to save.")).toBe("Failed to save.");
    expect(describeMutationError(null, "Failed to save.")).toBe("Failed to save.");
  });
});
