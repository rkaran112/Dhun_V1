import { parseApiErrorMessage } from "@/lib/http";

describe("parseApiErrorMessage", () => {
  it("extracts the error field from a JSON error body", () => {
    const text = JSON.stringify({ error: "Search query must be at least 2 characters" });
    expect(parseApiErrorMessage(text, "Search failed")).toBe(
      "Search query must be at least 2 characters",
    );
  });

  it("returns the raw text when it is not JSON", () => {
    expect(parseApiErrorMessage("Internal Server Error", "Search failed")).toBe(
      "Internal Server Error",
    );
  });

  it("returns the fallback when the body is empty", () => {
    expect(parseApiErrorMessage("", "Search failed")).toBe("Search failed");
  });

  it("returns the raw text when JSON has no usable error field", () => {
    const text = JSON.stringify({ message: "nope" });
    expect(parseApiErrorMessage(text, "Search failed")).toBe(text);
  });
});
