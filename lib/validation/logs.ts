import { z } from "zod";

export const shelfEnum = z.enum(["listened", "want to listen"]);

export const insertLogSchema = z.object({
  album_id: z.string().min(1),
  album_name: z.string().min(1),
  artist_name: z.string().min(1),
  cover_url: z.string().url().optional().nullable(),
  rating: z
    .number()
    .min(0.5, "Rating must be at least 0.5")
    .max(5, "Rating cannot exceed 5")
    .refine((value) => Number.isInteger(value * 2), {
      message: "Rating must be in 0.5 increments",
    }),
  shelves: z.array(shelfEnum).min(1, "Select at least one shelf"),
  review_text: z
    .string()
    .max(2000, "Review is too long")
    .optional()
    .default(""),
});

export type InsertLogInput = z.infer<typeof insertLogSchema>;
