import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaItem,
  PageItem,
} from "@/shared/sources/source-types";
import type {
  KomikNesiaChapter,
  KomikNesiaDetail,
  KomikNesiaGenreRef,
  KomikNesiaItem,
} from "./types";

export function normalizeKomikNesiaStatus(
  status?: string
): "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" {
  if (!status) return "UNKNOWN";
  const lower = status.toLowerCase();
  if (lower === "ongoing" || lower === "hiatus" || lower === "berlangsung") return "ONGOING";
  if (lower === "completed" || lower === "tamat" || lower === "selesai") return "COMPLETED";
  if (lower === "cancelled" || lower === "dropped" || lower === "batal") return "CANCELLED";
  return "UNKNOWN";
}

function extractGenreNames(genres?: string[] | KomikNesiaGenreRef[]): string[] {
  if (!Array.isArray(genres)) return [];
  return genres
    .map((g) => (typeof g === "string" ? g : g?.name ?? ""))
    .filter(Boolean) as string[];
}

export function normalizeKomikNesiaMangaItem(item: KomikNesiaItem): MangaItem {
  const latestCh = item.latestChapter;
  const latestChNum =
    latestCh?.number != null ? `Chapter ${latestCh.number}` : undefined;
  const latestChTime = latestCh?.releasedAt || latestCh?.createdAt || item.updatedAt || undefined;

  return {
    id: item.slug,
    title: item.title,
    coverUrl: item.cover || item.thumbnail || "",
    status: normalizeKomikNesiaStatus(item.status),
    format: item.type ? item.type.toUpperCase() : undefined,
    latestChapter: latestChNum,
    latestChapterTime: latestChTime,
    description: item.description || undefined,
  };
}

export function normalizeKomikNesiaMangaDetail(detail: KomikNesiaDetail): MangaDetail {
  const base = normalizeKomikNesiaMangaItem(detail);
  const genres = extractGenreNames(detail.genres);

  return {
    ...base,
    status: normalizeKomikNesiaStatus(detail.status),
    description: detail.description || detail.synopsis || "",
    genres,
    author: detail.author || undefined,
    artist: detail.artist || undefined,
  };
}

export function normalizeKomikNesiaChapter(
  chapter: KomikNesiaChapter,
  mangaSlug: string
): Chapter {
  const slug =
    typeof chapter.slug === "string" && chapter.slug.length > 0
      ? chapter.slug
      : null;

  const chapterId = slug ?? `${mangaSlug}-chapter-${chapter.number ?? chapter.id}`;

  const chapterNum =
    chapter.number != null ? Number(chapter.number) : 0;

  const title =
    chapter.title ||
    (chapter.number != null ? `Chapter ${chapter.number}` : `Chapter ${chapter.id}`);

  return {
    id: chapterId,
    mangaId: mangaSlug,
    number: chapterNum,
    title,
    date:
      chapter.releasedAt ||
      chapter.createdAt ||
      new Date().toISOString(),
  };
}

export function normalizeKomikNesiaPages(
  images: string[],
  chapterId: string
): ChapterPages {
  const pages: PageItem[] = images
    .filter((url) => typeof url === "string" && url.length > 0)
    .map((url, index) => ({ index, url }));

  return { chapterId, pages };
}
