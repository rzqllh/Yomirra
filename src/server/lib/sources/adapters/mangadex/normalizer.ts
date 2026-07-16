import type {
  MangaItem,
  MangaDetail,
  Chapter,
} from "@/shared/sources/source-types";
import type {
  MangaDexManga,
  MangaDexChapter,
  MangaDexLocalizedString,
  MangaDexRelationship,
} from "./types";

const COVER_BASE = "https://uploads.mangadex.org/covers";

/** Pick best localized string: ja → en → first available */
function pickTitle(titles: MangaDexLocalizedString): string {
  return titles.en || titles.ja || titles["ja-ro"] || Object.values(titles)[0] || "Untitled";
}

/** Pick description preferring en */
function pickDescription(desc: MangaDexLocalizedString): string {
  return desc.id || desc.en || Object.values(desc)[0] || "";
}

/** Extract cover filename from relationships */
function getCoverFilename(relationships: MangaDexRelationship[]): string | null {
  const cover = relationships.find(r => r.type === "cover_art");
  return (cover?.attributes?.fileName as string) || null;
}

/** Build cover URL with 512px thumbnail */
function buildCoverUrl(mangaId: string, relationships: MangaDexRelationship[]): string {
  const filename = getCoverFilename(relationships);
  if (!filename) return "";
  return `${COVER_BASE}/${mangaId}/${filename}.512.jpg`;
}

/** Extract author/artist name from relationships */
function getCreator(relationships: MangaDexRelationship[], type: "author" | "artist"): string | undefined {
  const match = relationships.find(r => r.type === type);
  return (match?.attributes?.name as string) || undefined;
}

export function normalizeMangaDexStatus(status: string): "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" {
  switch (status) {
    case "ongoing": return "ONGOING";
    case "completed": return "COMPLETED";
    case "hiatus": return "ONGOING"; // treat hiatus as ongoing
    case "cancelled": return "CANCELLED";
    default: return "UNKNOWN";
  }
}

function getFormat(manga: MangaDexManga): string | undefined {
  const formatTag = manga.attributes.tags.find(t => t.attributes.group === "format");
  if (formatTag) return pickTitle(formatTag.attributes.name);
  // Infer from originalLanguage
  switch (manga.attributes.originalLanguage) {
    case "ja": return "Manga";
    case "ko": return "Manhwa";
    case "zh": return "Manhua";
    default: return undefined;
  }
}

export function normalizeMangaItem(manga: MangaDexManga): MangaItem {
  return {
    id: manga.id,
    title: pickTitle(manga.attributes.title),
    coverUrl: buildCoverUrl(manga.id, manga.relationships),
    status: normalizeMangaDexStatus(manga.attributes.status),
    format: getFormat(manga),
  };
}

export function normalizeMangaDetail(manga: MangaDexManga): MangaDetail {
  const genres = manga.attributes.tags
    .filter(t => t.attributes.group === "genre" || t.attributes.group === "theme")
    .map(t => pickTitle(t.attributes.name));

  return {
    id: manga.id,
    title: pickTitle(manga.attributes.title),
    coverUrl: buildCoverUrl(manga.id, manga.relationships),
    description: pickDescription(manga.attributes.description),
    author: getCreator(manga.relationships, "author"),
    artist: getCreator(manga.relationships, "artist"),
    genres,
    status: normalizeMangaDexStatus(manga.attributes.status),
    format: getFormat(manga),
  };
}

export function normalizeChapter(chapter: MangaDexChapter, mangaId: string): Chapter {
  const num = chapter.attributes.chapter ? parseFloat(chapter.attributes.chapter) : 0;
  const lang = chapter.attributes.translatedLanguage;
  const isEn = lang === "en";

  let title = chapter.attributes.title || `Chapter ${num || "?"}`;
  // Add EN warning if not Indonesian
  if (isEn) {
    title = `${title} [EN]`;
  }

  return {
    id: chapter.id,
    mangaId,
    number: num,
    title,
    date: chapter.attributes.readableAt || chapter.attributes.publishAt || "",
  };
}
