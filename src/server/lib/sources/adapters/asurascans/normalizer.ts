import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaItem,
  PageItem,
} from "@/shared/sources/source-types";
import type {
  AsuraChapterItem,
  AsuraChapterReadResponse,
  AsuraSeriesItem,
} from "./types";

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

export function normalizeAsuraStatus(status?: string): "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" {
  if (!status) return "UNKNOWN";
  const lower = status.toLowerCase();
  if (lower === "ongoing" || lower === "hiatus") return "ONGOING";
  if (lower === "completed") return "COMPLETED";
  if (lower === "cancelled" || lower === "dropped") return "CANCELLED";
  return "UNKNOWN";
}

export function normalizeAsuraMangaItem(item: AsuraSeriesItem): MangaItem {
  const latestCh = Array.isArray(item.latest_chapters) && item.latest_chapters.length > 0
    ? item.latest_chapters[0]
    : undefined;

  return {
    id: item.slug,
    title: item.title,
    coverUrl: item.cover,
    status: normalizeAsuraStatus(item.status),
    format: item.type ? item.type.toUpperCase() : undefined,
    latestChapter: latestCh?.number != null ? `Chapter ${latestCh.number}` : undefined,
    latestChapterTime: latestCh?.published_at || item.last_chapter_at || undefined,
    rank: typeof item.popularity_rank === "number" ? item.popularity_rank : undefined,
    score: typeof item.rating === "number" ? Math.round(item.rating * 10) / 10 : undefined,
    description: item.description ? stripHtml(item.description) : undefined,
  };
}

export function normalizeAsuraMangaDetail(series: AsuraSeriesItem): MangaDetail {
  const base = normalizeAsuraMangaItem(series);
  const genres = Array.isArray(series.genres)
    ? series.genres.map((g) => g.name).filter(Boolean)
    : [];

  return {
    ...base,
    description: series.description ? stripHtml(series.description) : "",
    genres,
    status: normalizeAsuraStatus(series.status),
  };
}

export function buildAsuraChapterId(seriesSlug: string, chapterParam: string | number): string {
  return `${seriesSlug}::${chapterParam}`;
}

export function parseAsuraChapterId(chapterId: string): { seriesSlug: string; chapterParam: string } {
  let decoded = chapterId;
  try {
    decoded = decodeURIComponent(chapterId);
  } catch {
    decoded = chapterId;
  }

  const delimiterIndex = decoded.indexOf("::");
  if (delimiterIndex !== -1) {
    return {
      seriesSlug: decoded.substring(0, delimiterIndex).trim(),
      chapterParam: decoded.substring(delimiterIndex + 2).trim(),
    };
  }

  return {
    seriesSlug: "",
    chapterParam: decoded.trim(),
  };
}

export function normalizeAsuraChapter(chapter: AsuraChapterItem, seriesSlug: string): Chapter {
  const chapterParam = chapter.slug || (chapter.number != null ? String(chapter.number) : String(chapter.id));
  const chapterNumber = typeof chapter.number === "number" ? chapter.number : 0;
  
  // Format title gracefully
  const title = chapter.number != null
    ? `Chapter ${chapter.number}`
    : (chapter.slug ? chapter.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : `Chapter ${chapter.id}`);

  // Determine locked status: is_locked, is_premium, or future early_access_until
  let isEarlyAccess = false;
  if (chapter.early_access_until) {
    const accessTime = new Date(chapter.early_access_until).getTime();
    if (!isNaN(accessTime) && accessTime > Date.now()) {
      isEarlyAccess = true;
    }
  }

  const isLocked = Boolean(chapter.is_locked || chapter.is_premium || isEarlyAccess);

  return {
    id: buildAsuraChapterId(seriesSlug, chapterParam),
    mangaId: seriesSlug,
    number: chapterNumber,
    title,
    date: chapter.published_at || chapter.created_at || new Date().toISOString(),
    isLocked,
  };
}

export function normalizeAsuraPages(res: AsuraChapterReadResponse, chapterId: string): ChapterPages {
  // If the chapter is locked upstream, we MUST return empty pages array without attempting bypass
  if (res?.data?.is_locked === true) {
    return {
      chapterId,
      pages: [],
    };
  }

  const rawPages = res?.data?.chapter?.pages;
  if (!Array.isArray(rawPages)) {
    return {
      chapterId,
      pages: [],
    };
  }

  const pages: PageItem[] = rawPages.map((page, index) => ({
    index,
    url: page.url,
    width: typeof page.width === "number" ? page.width : undefined,
    height: typeof page.height === "number" ? page.height : undefined,
  }));

  return {
    chapterId,
    pages,
  };
}
