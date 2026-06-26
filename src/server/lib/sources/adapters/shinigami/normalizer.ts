import { parseDate, stripHtml } from "@/shared/utils/normalize";
import type { Chapter, MangaDetail, MangaItem } from "@/shared/types/source";
import { signImageUrl } from "@/server/lib/sign-proxy-url";
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

export function normalizeMangaItem(item: ShinigamiMangaItem & Record<string, unknown>): MangaItem {
  const coverUrl = item.cover_portrait_url || item.cover_image_url || "";
  let format: string | undefined = undefined;

  if (item.taxonomy?.Format?.[0]?.name) {
    format = item.taxonomy.Format[0].name;
  } else if (item.taxonomy?.Type?.[0]?.name) {
    format = item.taxonomy.Type[0].name;
  } else if (typeof item.type === "string") {
    format = item.type;
  }

  return {
    id: item.manga_id,
    title: item.title,
    coverUrl: signImageUrl(coverUrl, "https://c.shinigami.asia"),
    status: normalizeShinigamiStatus(item.status),
    format,
    latestChapter: item.latest_chapter_number ? `Chapter ${item.latest_chapter_number}` : undefined,
    latestChapterTime: item.latest_chapter_time,
    score: (item.user_rate ?? item.rating) as number | undefined,
  };
}

export function normalizeMangaDetail(detail: ShinigamiMangaDetail): MangaDetail {
  const coverUrl = detail.cover_image_url || detail.cover_portrait_url || "";
  
  let author = detail.author;
  if (!author && detail.taxonomy?.Author?.[0]?.name) {
    author = detail.taxonomy.Author.map(a => a.name).join(", ");
  }

  let artist = detail.artist;
  if (!artist && detail.taxonomy?.Artist?.[0]?.name) {
    artist = detail.taxonomy.Artist.map(a => a.name).join(", ");
  }

  let genres: string[] = [];
  if (detail.genres?.length) {
    genres = detail.genres.map(g => g.name);
  } else if (detail.taxonomy?.Genre?.length) {
    genres = detail.taxonomy.Genre.map(g => g.name);
  }

  return {
    id: detail.manga_id,
    title: detail.title,
    coverUrl: signImageUrl(coverUrl, "https://c.shinigami.asia"),
    description: stripHtml(detail.description),
    author,
    artist,
    genres,
    status: normalizeShinigamiStatus(detail.status),
    score: ((detail as any).user_rate ?? (detail as any).rating) as number | undefined,
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
