import { z } from "zod";

export const CustomHtmlSelectorsSchema = z.object({
  popularPath: z.string().default("/"),
  popularListSelector: z.string().min(1, "Selector list manga wajib diisi"),
  titleSelector: z.string().min(1, "Selector title wajib diisi"),
  coverSelector: z.string().default("img"),
  linkSelector: z.string().default("a"),
  
  // Detail & Chapters
  synopsisSelector: z.string().optional(),
  chapterListSelector: z.string().optional(),
  chapterTitleSelector: z.string().optional(),
  chapterLinkSelector: z.string().optional(),
  
  // Reader pages
  pagesSelector: z.string().optional(),
});

export const CustomSourceSchema = z.object({
  id: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, "ID hanya boleh huruf kecil, angka, dan strip (-)"),
  name: z.string().min(2, "Nama sumber minimal 2 karakter"),
  baseUrl: z.string().url("Format Base URL tidak valid"),
  mirrors: z.array(z.string().url()).default([]),
  lang: z.string().length(2).default("id"),
  version: z.string().default("1.0.0"),
  type: z.enum(["html", "api"]).default("html"),
  isNsfw: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  selectors: CustomHtmlSelectorsSchema.optional(),
  endpoints: z.object({
    popular: z.string().optional(),
    latest: z.string().optional(),
    search: z.string().optional(),
    detail: z.string().optional(),
    chapters: z.string().optional(),
    pages: z.string().optional(),
  }).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CustomSourceDefinition = z.infer<typeof CustomSourceSchema>;
export type CustomHtmlSelectors = z.infer<typeof CustomHtmlSelectorsSchema>;
