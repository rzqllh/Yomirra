import { normalizeSynopsis } from "@/shared/utils/normalize";
import { normalizeExternalWorkIds } from "@/shared/lib/external-work-ids";
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
  // Long Strip, Oneshot and Full Color describe an edition, not the
  // manga/manhwa/manhua medium. Keep these in genres/tags, never as identity.
  const explicit = manga.attributes.tags.filter(t => t.attributes.group === "format")
    .map(t => pickTitle(t.attributes.name))
    .find(name => /^(manga|manhwa|manhua)$/i.test(name));
  if (explicit) return explicit[0].toUpperCase() + explicit.slice(1).toLowerCase();
  // Language is a conventional classification hint, not identity proof.
  switch (manga.attributes.originalLanguage) {
    case "ja": return "Manga";
    case "ko": return "Manhwa";
    case "zh":
    case "zh-hk": return "Manhua";
    default: return undefined;
  }
}

function identityMetadata(manga: MangaDexManga): Pick<MangaItem, "originalTitle" | "alternativeTitles" | "externalWorkIds"> {
  const attrs = manga.attributes;
  const values = [attrs.title, ...(Array.isArray(attrs.altTitles) ? attrs.altTitles : [])]
    .flatMap(value => value && typeof value === "object" ? Object.values(value) : [])
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map(value => value.trim());
  const alternativeTitles = [...new Set(values)].filter(title => title !== pickTitle(attrs.title)).slice(0, 100);
  const originalTitle = attrs.title[attrs.originalLanguage] ??
    attrs.altTitles?.find(value => value?.[attrs.originalLanguage])?.[attrs.originalLanguage];
  const externalWorkIds = normalizeExternalWorkIds({ anilist: attrs.links?.al, my_anime_list: attrs.links?.mal, manga_updates: attrs.links?.mu });
  return {
    ...(originalTitle ? { originalTitle } : {}),
    ...(alternativeTitles.length ? { alternativeTitles } : {}),
    ...(externalWorkIds ? { externalWorkIds } : {}),
  };
}

export function normalizeMangaItem(manga: MangaDexManga): MangaItem {
  const desc = normalizeSynopsis(pickDescription(manga.attributes.description));
  const lastCh = manga.attributes.lastChapter ? `Chapter ${manga.attributes.lastChapter}` : undefined;

  return {
    id: manga.id,
    title: pickTitle(manga.attributes.title),
    ...identityMetadata(manga),
    coverUrl: buildCoverUrl(manga.id, manga.relationships),
    status: normalizeMangaDexStatus(manga.attributes.status),
    format: getFormat(manga),
    latestChapter: lastCh,
    description: desc || undefined,
    contentRating: manga.attributes.contentRating ?? "unknown",
    isNsfw: manga.attributes.contentRating !== "safe",
  };
}

export function normalizeMangaDetail(manga: MangaDexManga): MangaDetail {
  const genres = manga.attributes.tags
    .filter(t => t.attributes.group === "genre" || t.attributes.group === "theme")
    .map(t => pickTitle(t.attributes.name));

  return {
    id: manga.id,
    title: pickTitle(manga.attributes.title),
    ...identityMetadata(manga),
    coverUrl: buildCoverUrl(manga.id, manga.relationships),
    description: normalizeSynopsis(pickDescription(manga.attributes.description)),
    author: getCreator(manga.relationships, "author"),
    artist: getCreator(manga.relationships, "artist"),
    genres,
    status: normalizeMangaDexStatus(manga.attributes.status),
    format: getFormat(manga),
    contentRating: manga.attributes.contentRating ?? "unknown",
    isNsfw: manga.attributes.contentRating !== "safe",
  };
}

export function normalizeChapter(chapter: MangaDexChapter, mangaId: string): Chapter {
  const num = chapter.attributes.chapter ? parseFloat(chapter.attributes.chapter) : 0;
  const lang = chapter.attributes.translatedLanguage;
  const isEn = lang === "en";

  let title = chapter.attributes.title || `Chapter ${chapter.attributes.chapter ?? "?"}`;
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
    language: lang,
    volume: chapter.attributes.volume ?? undefined,
    pageCount: chapter.attributes.pages,
    chapterNumber: chapter.attributes.chapter ?? undefined,
    scanlator: chapter.relationships
      .filter((relationship) => relationship.type === "scanlation_group")
      .map((relationship) => relationship.attributes?.name)
      .filter((name): name is string => typeof name === "string")
      .join(", ") || undefined,
  };
}
