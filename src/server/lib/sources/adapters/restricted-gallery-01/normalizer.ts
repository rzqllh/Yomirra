import type {
  Chapter,
  MangaDetail,
  MangaItem,
  MangaPageResult,
  PageItem,
} from "@/shared/sources/source-types";

/**
 * Server-only, deliberately conservative normalizer. The upstream gallery
 * contract is unverified live. Malformed data fails closed rather than
 * inventing a title, cover, chapter or playable image URL.
 */
const GALLERY_ID = /^[1-9]\d{0,11}$/;
const MAX_PAGES = 300;
const IMAGE_EXTENSIONS: Record<string, string> = {
  j: "jpg",
  p: "png",
  w: "webp",
  g: "gif",
};
const SOURCE_ORIGIN = "https://nhentai.net";
const PAGE_ORIGIN = "https://i.nhentai.net";
const THUMB_ORIGIN = "https://t.nhentai.net";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("SCHEMA_CHANGED: Expected object");
  }
  return value as UnknownRecord;
}

export function numericId(value: unknown): string {
  const id = typeof value === "number" && Number.isSafeInteger(value)
    ? String(value)
    : typeof value === "string"
      ? value
      : "";
  if (!GALLERY_ID.test(id)) throw new Error("SCHEMA_CHANGED: Invalid gallery identifier");
  return id;
}

function imageExtension(value: unknown): string {
  const ext = typeof value === "string" ? IMAGE_EXTENSIONS[value] : undefined;
  if (!ext) throw new Error("SCHEMA_CHANGED: Unsupported image encoding");
  return ext;
}

function titleOf(raw: UnknownRecord, id: string): string {
  const names = record(raw.title);
  for (const key of ["english", "pretty", "japanese"]) {
    const name = names[key];
    if (typeof name === "string" && name.trim()) return name.trim().slice(0, 500);
  }
  throw new Error("SCHEMA_CHANGED: Gallery title missing");
}

function tagsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value.flatMap((entry) => {
    if (typeof entry !== "object" || !entry || Array.isArray(entry)) return [];
    const name = (entry as UnknownRecord).name;
    return typeof name === "string" && name.trim()
      ? [name.trim().slice(0, 100)]
      : [];
  });
  return [...new Set(names)].slice(0, 100);
}

function dateOf(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
  const timestamp = value * 1000;
  if (timestamp > 8640000000000000) return "";
  return new Date(timestamp).toISOString();
}

export interface NormalizedGallery {
  item: MangaItem;
  detail: MangaDetail;
  chapter: Chapter;
  pages: PageItem[];
}

export function normalizeGallery(value: unknown): NormalizedGallery {
  const raw = record(value);
  const id = numericId(raw.id);
  const mediaId = numericId(raw.media_id);
  const images = record(raw.images);
  if (!Array.isArray(images.pages) || images.pages.length === 0 ||
      images.pages.length > MAX_PAGES) {
    throw new Error("SCHEMA_CHANGED: Invalid image page array");
  }
  if (typeof raw.num_pages === "number" &&
      raw.num_pages !== images.pages.length) {
    throw new Error("SCHEMA_CHANGED: Page count mismatch");
  }
  const title = titleOf(raw, id);
  const tags = tagsOf(raw.tags);
  const pageImages = images.pages.map((image, index) => {
    const data = record(image);
    const ext = imageExtension(data.t);
    return {
      index,
      url: PAGE_ORIGIN + "/galleries/" + mediaId + "/" + (index + 1) + "." + ext,
      referer: SOURCE_ORIGIN + "/",
      ...(typeof data.w === "number" && data.w > 0 && data.w < 20000 ? { width: data.w } : {}),
      ...(typeof data.h === "number" && data.h > 0 && data.h < 20000 ? { height: data.h } : {}),
    } satisfies PageItem;
  });
  const coverFormat = images.cover && typeof images.cover === "object"
    ? imageExtension(record(images.cover).t)
    : imageExtension(record(images.pages[0]).t);
  const coverUrl = THUMB_ORIGIN + "/galleries/" + mediaId + "/cover." + coverFormat;
  const date = dateOf(raw.upload_date);

  const item: MangaItem = {
    id,
    title,
    coverUrl,
    latestChapter: "Chapter 1",
    contentRating: "pornographic",
    isNsfw: true,
    status: "UNKNOWN",
  };
  const detail: MangaDetail = {
    ...item,
    description: "",
    genres: tags,
    status: "UNKNOWN",
  };
  const chapter: Chapter = {
    id: id + "-ch1",
    mangaId: id,
    number: 1,
    title: "Chapter 1",
    date,
    pageCount: pageImages.length,
  };
  return { item, detail, chapter, pages: pageImages };
}

export function normalizeListing(value: unknown, page: number): MangaPageResult {
  const raw = record(value);
  if (!Array.isArray(raw.result)) throw new Error("SCHEMA_CHANGED: Listing absent");
  const mangas = raw.result.map((entry) => normalizeGallery(entry).item);
  const pages = raw.num_pages;
  return {
    mangas,
    // Never infer pagination from item count without upstream metadata.
    hasNextPage: typeof pages === "number" &&
      Number.isSafeInteger(pages) && pages > page,
  };
}

export function chapterGalleryId(chapterId: string): string {
  const match = /^([1-9]\d{0,11})-ch1$/.exec(chapterId);
  if (!match) throw new Error("SCHEMA_CHANGED: Invalid chapter reference");
  return match[1];
}
