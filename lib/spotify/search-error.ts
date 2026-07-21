import { ZodError } from "zod";

export function describeSearchError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof ZodError) {
    return {
      message: error.issues[0]?.message ?? "Invalid search query.",
      status: 400,
    };
  }

  return {
    message: "Failed to search Spotify. Please try again.",
    status: 502,
  };
}
