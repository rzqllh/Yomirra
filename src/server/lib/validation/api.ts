import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().max(100, "Search query is too long").optional().default(""),
});

// Since Next.js dynamic params are strings, we can validate them
export const sourceParamsSchema = z.object({
  sourceId: z.string().min(1, "Source ID is required"),
});

export const mangaParamsSchema = sourceParamsSchema.extend({
  mangaId: z.string().min(1, "Manga ID is required"),
});

export const chapterParamsSchema = mangaParamsSchema.extend({
  chapterId: z.string().min(1, "Chapter ID is required"),
});
