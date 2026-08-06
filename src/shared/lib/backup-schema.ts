import { z } from "zod";

// ISO timestamp validator helper
const isIsoDate = (val: string) => !isNaN(Date.parse(val));

export const libraryItemBackupSchema = z.object({
  sourceId: z.string().min(1),
  mangaId: z.string().min(1),
  title: z.string().min(1),
  coverUrl: z.string().optional(),
  author: z.string().optional(),
  status: z.string().optional(),
  format: z.string().optional(),
  sourceName: z.string().optional(),
  addedAt: z.string().refine(isIsoDate, { message: "addedAt harus berupa ISO date string yang valid" }),
  updatedAt: z.string().refine(isIsoDate, { message: "updatedAt harus berupa ISO date string yang valid" }),
  lastReadChapterId: z.string().optional(),
  lastReadChapterTitle: z.string().optional(),
  lastReadAt: z.string().optional(),
  userRating: z.number().min(1).max(10).optional(),
  isNsfw: z.boolean().optional(),
});

export const historyItemBackupSchema = z.object({
  sourceId: z.string().min(1),
  mangaId: z.string().min(1),
  chapterId: z.string().min(1),
  mangaTitle: z.string().min(1),
  chapterTitle: z.string().optional(),
  coverUrl: z.string().optional(),
  sourceName: z.string().optional(),
  pageIndex: z.number().min(0).optional(),
  pageOffset: z.number().optional(),
  totalPages: z.number().min(0).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  seriesProgressPercent: z.number().min(0).max(100).optional(),
  chapterIndex: z.number().min(0).optional(),
  totalChapters: z.number().min(0).optional(),
  scrollPercent: z.number().min(0).max(100).optional(),
  readAt: z.number().positive().finite(),
  isNsfw: z.boolean().optional(),
});

export const whitelistedSettingsSchema = z.object({
  dataSaver: z.boolean(),
  hideNsfw: z.boolean(),
  keepScreenAwakeDuringDownloads: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
});

export const readerPreferencesBackupSchema = z.object({
  imageFit: z.enum(["width", "contained"]),
  pageGap: z.enum(["none", "small", "comfortable"]),
  background: z.enum(["black", "deepLagoon", "mist"]),
  toolbarBehavior: z.enum(["auto-hide", "always-visible"]),
  preloadIntensity: z.enum(["light", "balanced", "aggressive"]),
  showPageProgress: z.boolean(),
  readingDirection: z.enum(["ltr", "rtl"]),
  readingMode: z.enum(["vertical"]),
  keepScreenAwakeWhileReading: z.boolean(),
});

export const sourcePreferencesBackupSchema = z.object({
  disabledSources: z.array(z.string()),
  hiddenFromHomeSources: z.array(z.string()),
});

export const statsBackupSchema = z.object({
  totalReadingTimeMs: z.number().min(0).finite(),
});

export const updateItemBackupSchema = z.object({
  sourceId: z.string().min(1),
  mangaId: z.string().min(1),
  mangaTitle: z.string().min(1),
  coverUrl: z.string().optional(),
  sourceName: z.string().optional(),
  lastKnownChapterId: z.string().optional(),
  lastKnownChapterNumber: z.number().optional(),
  lastKnownChapterTitle: z.string().optional(),
  latestChapterId: z.string().optional(),
  latestChapterNumber: z.number().optional(),
  latestChapterTitle: z.string().optional(),
  detectedAt: z.string().optional(),
  lastCheckedAt: z.string().optional(),
  seenAt: z.string().optional(),
  error: z.string().optional(),
});

export const yomirraBackupSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  appVersion: z.string().min(1),
  exportedAt: z.string().refine(isIsoDate, { message: "exportedAt harus berupa ISO date string yang valid" }),
  data: z.object({
    library: z.array(libraryItemBackupSchema).max(1000, "Library tidak boleh melebihi 1000 item"),
    history: z.array(historyItemBackupSchema).max(1000, "History tidak boleh melebihi 1000 item"),
    updates: z.array(updateItemBackupSchema).max(1000, "Updates tidak boleh melebihi 1000 item").optional(),
    settings: whitelistedSettingsSchema,
    readerPreferences: readerPreferencesBackupSchema,
    sourcePreferences: sourcePreferencesBackupSchema,
    stats: statsBackupSchema,
  }),
});

export type YomirraBackupV1 = z.infer<typeof yomirraBackupSchemaV1>;
export type LibraryItemBackup = z.infer<typeof libraryItemBackupSchema>;
export type HistoryItemBackup = z.infer<typeof historyItemBackupSchema>;
export type UpdateItemBackup = z.infer<typeof updateItemBackupSchema>;

export type ImportMode = "merge" | "replace";

export interface DryRunPathError {
  path: string;
  message: string;
}

export interface DryRunPreview {
  validLibraryCount: number;
  validHistoryCount: number;
  invalidItemCount: number;
  duplicateInPayloadCount: number;
  existingConflictCount: number;
  addedCount: number;
  replacedCount: number;
  retainedCount: number;
  excludedNsfwCount: number;
  warnings: string[];
  errors: DryRunPathError[];
  isVersionSupported: boolean;
  backupPayload?: YomirraBackupV1;
}
