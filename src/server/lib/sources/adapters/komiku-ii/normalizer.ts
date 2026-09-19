import { parseDate, stripHtml } from "@/shared/utils/normalize";
import type { Chapter, ChapterPages, MangaDetail, MangaItem } from "@/shared/types/source";
import type {
  KomikuIIChapterItem,
  KomikuIIChapterPagesResponse,
  KomikuIIDetail,
  KomikuIIItem,
} from "./types";

/**
 * Builds a deterministic compound ID for a manga in Komiku II: `${comicId}::${slug}`.
 */
export function buildKomikuIIMangaId(numericId: number | string, slug: string): string {
  return `${numericId}::${slug.trim()}`;
}

/**
 * Parses a Komiku II mangaId.
 * Supports:
 * - Compound format: "45959::legend-of-star-general" -> { comicId: 45959, slug: "legend-of-star-general" }
 * - Slug only fallback: "legend-of-star-general" -> { slug: "legend-of-star-general" }
 * - Numeric only fallback: "45959" -> { comicId: 45959, slug: "" }
 */
export function parseKomikuIIMangaId(mangaId: string): { comicId?: number; slug: string } {
  if (!mangaId || typeof mangaId !== "string") {
    throw new Error("INVALID_MANGA_ID: mangaId must be a non-empty string");
  }

  let decoded = mangaId.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  const delimiterIndex = decoded.indexOf("::");

  if (delimiterIndex !== -1) {
    const numericPart = decoded.slice(0, delimiterIndex);
    const slugPart = decoded.slice(delimiterIndex + 2);
    const parsedNum = Number(numericPart);
    if (!Number.isNaN(parsedNum) && parsedNum > 0 && slugPart.trim().length > 0) {
      return { comicId: parsedNum, slug: slugPart.trim() };
    }
  }

  const asNum = Number(decoded);
  if (!Number.isNaN(asNum) && asNum > 0) {
    return { comicId: asNum, slug: "" };
  }

  return { slug: decoded };
}

/**
 * Builds a deterministic compound ID for a chapter in Komiku II: `${comicId}::${chapterId}`.
 */
export function buildKomikuIIChapterId(comicId: number | string, chapterId: number | string): string {
  return `${comicId}::${chapterId}`;
}

/**
 * Parses a Komiku II chapterId. Expects `${comicId}::${chapterId}`.
 */
export function parseKomikuIIChapterId(chapterId: string): { comicId: number; chapterId: number } {
  if (!chapterId || typeof chapterId !== "string") {
    throw new Error("INVALID_CHAPTER_ID: chapterId must be a non-empty string");
  }

  let decoded = chapterId.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  const parts = decoded.split("::");
  if (parts.length === 2) {
    const comicId = Number(parts[0]);
    const cid = Number(parts[1]);
    if (!Number.isNaN(comicId) && !Number.isNaN(cid) && comicId > 0 && cid > 0) {
      return { comicId, chapterId: cid };
    }
  }

  throw new Error(`INVALID_CHAPTER_ID: Expected format {comicId}::{chapterId}, got "${chapterId}"`);
}

/**
 * Normalizes Komiku II status string to standard Yomirra status.
 */
export function normalizeKomikuIIStatus(status?: string): MangaDetail["status"] {
  if (!status) return "UNKNOWN";
  const s = status.toLowerCase();
  if (s.includes("ongoing") || s.includes("berjalan")) return "ONGOING";
  if (s.includes("completed") || s.includes("tamat")) return "COMPLETED";
  if (s.includes("cancelled") || s.includes("drop")) return "CANCELLED";
  return "UNKNOWN";
}

/**
 * Normalizes a Komiku II listing item into a MangaItem.
 */
export function normalizeKomikuIIMangaItem(item: KomikuIIItem): MangaItem {
  const compoundId = buildKomikuIIMangaId(item.id, item.slug);

  let latestChapterTime: string | undefined = undefined;
  if (item.updatedHoursAgo !== undefined) {
    latestChapterTime = `${item.updatedHoursAgo} jam lalu`;
  } else if (item.latestChapterAt) {
    latestChapterTime = parseDate(new Date(item.latestChapterAt).toISOString());
  }

  return {
    id: compoundId,
    title: item.title?.trim() || item.slug,
    coverUrl: item.coverUrl || "",
    status: normalizeKomikuIIStatus(item.status),
    format: item.type || undefined,
    latestChapter: item.latestChapter ? `Chapter ${item.latestChapter}` : undefined,
    latestChapterTime,
    score: typeof item.rating === "number" ? item.rating : undefined,
    originalTitle: item.alt ? item.alt.trim() : undefined,
  };
}

/**
 * Normalizes Komiku II detail payload into MangaDetail.
 */
export function normalizeKomikuIIMangaDetail(detail: KomikuIIDetail): MangaDetail {
  const baseItem = normalizeKomikuIIMangaItem(detail);

  return {
    ...baseItem,
    description: stripHtml(detail.synopsis || "Belum ada sinopsis."),
    author: detail.author?.trim() || undefined,
    artist: detail.artist?.trim() || undefined,
    genres: Array.isArray(detail.genres) ? detail.genres.filter(Boolean) : [],
    status: normalizeKomikuIIStatus(detail.status),
  };
}

/**
 * Normalizes a chapter entry from `/comics/{comicId}/chapters`.
 */
export function normalizeKomikuIIChapter(
  chapter: KomikuIIChapterItem,
  comicId: number,
  mangaId: string
): Chapter {
  const num = typeof chapter.n === "number" ? chapter.n : parseFloat(String(chapter.n)) || 0;
  const chapterId = buildKomikuIIChapterId(comicId, chapter.id);

  let date = chapter.releasedLabel?.trim() || "";
  if (!date && chapter.releasedAt) {
    date = parseDate(new Date(chapter.releasedAt).toISOString());
  }

  return {
    id: chapterId,
    mangaId,
    number: num,
    title: chapter.title?.trim() || `Chapter ${chapter.n}`,
    date,
    isLocked: false,
  };
}

/**
 * Normalizes chapter pages response from `/comics/{comicId}/chapters/id/{chapterId}`.
 */
export function normalizeKomikuIIPages(
  pagesRes: KomikuIIChapterPagesResponse,
  chapterId: string,
  referer?: string
): ChapterPages {
  const rawPages = Array.isArray(pagesRes.pages) ? pagesRes.pages : [];

  return {
    chapterId,
    pages: rawPages.map((p, idx) => ({
      index: typeof p.index === "number" ? p.index : idx,
      url: p.url,
      referer: referer || "https://01.komiku.asia/",
    })),
  };
}
