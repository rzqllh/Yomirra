export type ReportType = "chapter_error" | "source_broken" | "image_broken" | "other";

export interface UserReportPayload {
  type: ReportType;
  category: string;
  detail?: string;
  sourceId?: string;
  mangaId?: string;
  mangaTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageIndex?: number;
}

export interface UserReport {
  id: string;
  type: string;
  category: string;
  detail?: string;
  sourceId?: string;
  mangaId?: string;
  mangaTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageIndex?: number;
  status: "pending" | "investigating" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}
