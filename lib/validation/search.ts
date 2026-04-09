import { z } from "zod";

export const albumSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters")
    .max(100, "Search query is too long"),
});

export type AlbumSearchInput = z.infer<typeof albumSearchSchema>;
