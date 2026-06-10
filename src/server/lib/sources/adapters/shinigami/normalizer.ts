import { parseDate, stripHtml } from "@/shared/utils/normalize";
import type { Chapter, MangaDetail, MangaItem } from "@/shared/types/source";
import { signImageUrl } from "@/shared/utils/image";
import type {
  ShinigamiChapterItem,
  ShinigamiMangaDetail,
  ShinigamiMangaItem,
} from "./types";

export function normalizeShinigamiStatus(status?: string | number): MangaDetail["status"] {
  if (status === undefined || status === null) return "UNKNOWN";
  
  if (typeof status === "number") {
    // Shinigami mapping: 1 = Ongoing, 2 = Completed
    if (status === 1) return "ONGOING";
    if (status === 2) return "COMPLETED";
    return "UNKNOWN";
  }

  const s = status.toLowerCase();
  if (s.includes("ongoing")) return "ONGOING";
  if (s.includes("completed")) return "COMPLETED";
  if (s.includes("cancelled") || s.includes("dropped")) return "CANCELLED";
  return "UNKNOWN";
}

export function normalizeMangaItem(item: ShinigamiMangaItem): MangaItem {
  const coverUrl = item.cover_image_url || item.cover_portrait_url || "";
  return {
    id: item.manga_id,
    title: item.title,
    coverUrl: signImageUrl(coverUrl, "https://c.shinigami.asia"),
    status: item.status?.toString(),
  };
}

export function normalizeMangaDetail(detail: ShinigamiMangaDetail): MangaDetail {
  const coverUrl = detail.cover_image_url || detail.cover_portrait_url || "";
  return {
    id: detail.manga_id,
    title: detail.title,
    coverUrl: signImageUrl(coverUrl, "https://c.shinigami.asia"),
    description: stripHtml(detail.description),
    author: detail.author,
    artist: detail.artist,
    genres: detail.genres ? detail.genres.map((g) => g.name) : [],
    status: normalizeShinigamiStatus(detail.status),
  };
}

export function normalizeChapter(chapter: ShinigamiChapterItem, mangaId: string): Chapter {
  return {
    id: chapter.chapter_id,
    mangaId,
    number: chapter.chapter_number,
    title: chapter.chapter_title || `Chapter ${chapter.chapter_number}`,
    date: parseDate(chapter.release_date),
  };
}
