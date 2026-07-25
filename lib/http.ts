import { ZodError } from "zod";

export function describeMutationError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function parseApiErrorMessage(text: string, fallback: string): string {
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (parsed && typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error;
    }
  } catch {
    // Not JSON, fall through to the raw text.
  }

  return text;
}
