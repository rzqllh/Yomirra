import { cookies } from "next/headers";
import { ADULT_SESSION_COOKIE, verifyVerifiedAdultSession } from "@/server/lib/auth/admin-auth";
import type { NextRequest } from "next/server";
import { CACHE_TTL, getSourceCacheKey, withCache } from "@/server/lib/cache/redis-cache";
import { CONTENT_PREFERENCE_COOKIE, DATA_SAVER_COOKIE, LANGUAGE_PREFERENCE_COOKIE, isContentVisible, isSourceContentVisible, shouldHideNsfw, sourceReadScope } from "@/shared/sources/content-policy";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import type { Chapter, MangaSource, SourceReadOptions } from "@/shared/sources/source-types";
import { SourceError } from "./error";
import { loadSourceUpstream } from "./source-upstream";
import { applyLocalCanonicalMetadata } from "@/server/lib/metadata/local-catalog-index";
import { isTursoCatalogEnabled, lookupTursoCatalog } from "@/server/lib/metadata/turso-catalog";
import { comicFormat, inheritCanonicalRating, matchCanonicalMetadata } from "@/shared/lib/metadata-catalog";

/** Public request options are always safe. Do not treat a browser cookie as age proof. */
export function getRequestReadOptions(request: NextRequest): SourceReadOptions {
  const params = request.nextUrl.searchParams;
  const languages = parseLanguages(params.get("languages") ?? request.cookies?.get(LANGUAGE_PREFERENCE_COOKIE)?.value);
  return {
    hideNsfw: true,
    preferredLanguages: languages?.length ? languages.slice(0, 5) : undefined,
    dataSaver: (params.get("dataSaver") ?? request.cookies?.get(DATA_SAVER_COOKIE)?.value) === "true",
  };
}

/** Server-verifiable consent requires both opt-in and a signed age-verified session. */
export async function getVerifiedRequestReadOptions(request: NextRequest): Promise<SourceReadOptions> {
  const safe = getRequestReadOptions(request);
  const requested = !shouldHideNsfw(request.cookies?.get(CONTENT_PREFERENCE_COOKIE)?.value);
  const query = request.nextUrl.searchParams.get("hideNsfw");
  if (!requested || (query !== null && query !== "false")) return safe;
  const verified = await verifyVerifiedAdultSession(request.cookies?.get(ADULT_SESSION_COOKIE)?.value);
  return { ...safe, hideNsfw: !verified };
}

export async function getServerReadOptions(): Promise<SourceReadOptions> {
  const store = await cookies();
  const requested = !shouldHideNsfw(store.get(CONTENT_PREFERENCE_COOKIE)?.value);
  const verified = requested && await verifyVerifiedAdultSession(store.get(ADULT_SESSION_COOKIE)?.value);
  return {
    hideNsfw: !verified,
    preferredLanguages: parseLanguages(store.get(LANGUAGE_PREFERENCE_COOKIE)?.value),
    dataSaver: store.get(DATA_SAVER_COOKIE)?.value === "true",
  };
}

function parseLanguages(value?: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const languages = decodeURIComponent(value).split(",").filter((lang) => /^[a-z]{2}(?:-[a-zA-Z]{2})?$/.test(lang)).slice(0, 5);
    return languages.length ? languages : undefined;
  } catch { return undefined; }
}

export function assertSourceAccess(source: MangaSource, options: SourceReadOptions = {}): void {
  if (!isDiscoverySourceSystemEligible(source)) {
    throw new SourceError("Sumber sedang dinonaktifkan atau belum tersedia", {
      code: "SOURCE_DISABLED", sourceId: source.id, statusCode: 503,
    });
  }
  if (!isSourceContentVisible(source, options.hideNsfw !== false)) {
    throw new SourceError("Sumber disembunyikan oleh pengaturan konten", {
      code: "CONTENT_RESTRICTED", sourceId: source.id, statusCode: 403,
    });
  }
}

/** A new namespace separates safe responses from old unclassified cache entries. */
export function contentCacheKey(source: MangaSource, operation: string, params: string, options: SourceReadOptions = {}): string {
  return getSourceCacheKey(source, operation, `content-v2:${sourceReadScope(options)}:${params}`);
}

export async function loadSourceCatalog(source: MangaSource, operation: "popular" | "latest", page: number, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  const result = await withCache(contentCacheKey(source, operation, String(page), options),
    () => loadSourceUpstream(source.id, "search", null, () => operation === "popular" ? source.getPopular(page, options) : source.getLatest(page, options), source.cacheFingerprint), CACHE_TTL.DISCOVERY);
  return { ...result, mangas: result.mangas.map(applyLocalCanonicalMetadata).filter((item) => isContentVisible(item, options.hideNsfw !== false)) };
}

export async function loadSourceDetail(source: MangaSource, mangaId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  const key = contentCacheKey(source, "manga", mangaId, options);
  const rawDetail = await withCache(key,
    () => loadSourceUpstream(source.id, "detail", key, () => source.getDetail(mangaId, options), source.cacheFingerprint), CACHE_TTL.DETAIL);
  let detail=applyLocalCanonicalMetadata(rawDetail);
  // Explicit detail/reader access only; never remote lookup for every cover.
  // Preserve legacy visibility when optional metadata is unavailable.
  if(isTursoCatalogEnabled() && !source.isDynamic && detail.id===mangaId && comicFormat(detail.format)){
    const observed=await lookupTursoCatalog(detail.title,detail.externalWorkIds);
    if(observed)detail=inheritCanonicalRating(detail,matchCanonicalMetadata(detail,observed.works));
  }
  if (!isContentVisible(detail, options.hideNsfw !== false)) {
    throw new SourceError("Konten disembunyikan oleh pengaturan konten", {
      code: "CONTENT_RESTRICTED", sourceId: source.id, stage: "detail", statusCode: 403,
    });
  }
  return detail;
}

export async function loadSourceChapters(source: MangaSource, mangaId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  const key = contentCacheKey(source, "chapters", mangaId, options);
  return withCache(key,
    () => loadSourceUpstream(source.id, "chapters", key, () => source.getChapters(mangaId, options), source.cacheFingerprint), CACHE_TTL.CHAPTERS);
}

export function findMangaChapter(sourceId: string, chapterId: string, chapters: Chapter[]): Chapter {
  const chapter = chapters.find((item) => item.id === chapterId);
  if (!chapter) {
    throw new SourceError("Chapter tidak ditemukan pada komik ini", {
      code: "CHAPTER_UNAVAILABLE", sourceId, stage: "pages", statusCode: 404,
    });
  }
  return chapter;
}

export async function loadReadableSourcePages(source: MangaSource, mangaId: string, chapterId: string, options: SourceReadOptions = {}) {
  const detail = loadSourceDetail(source, mangaId, options);
  // MangaDex verifies the upstream parent itself, including alternate scanlations
  // intentionally omitted from the display list.
  if (source.id === "mangadex") {
    await detail;
  } else {
    const [, chapters] = await Promise.all([detail, loadSourceChapters(source, mangaId, options)]);
    if (findMangaChapter(source.id, chapterId, chapters).isLocked) {
      throw new SourceError("Chapter terkunci di sumber aslinya", {
        code: "CHAPTER_UNAVAILABLE", sourceId: source.id, stage: "pages", statusCode: 403,
      });
    }
  }
  return loadSourcePages(source, mangaId, chapterId, options);
}

export async function loadSourcePages(source: MangaSource, mangaId: string, chapterId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  // MangaDex @Home URLs expire. Never revive an expired URL from stale-on-error cache.
  const key = contentCacheKey(source, "pages", JSON.stringify([mangaId, chapterId]), options);
  return withCache(key,
    () => loadSourceUpstream(source.id, "pages", key, () => source.getPages(chapterId, { ...options, mangaId }), source.cacheFingerprint),
    source.id === "mangadex" ? 300 : CACHE_TTL.PAGES,
    { allowStaleOnError: source.id !== "mangadex" });
}

export function sourceErrorResponse(error: unknown, sourceId: string, stage: "search" | "detail" | "chapters" | "pages" = "detail") {
  const classified = SourceError.classify(error, sourceId, stage);
  const status = classified.code === "UPSTREAM_BLOCKED" ? 503 : classified.statusCode ?? (classified.code === "RATE_LIMITED" ? 429
    : classified.code === "CONTENT_NOT_FOUND" || classified.code === "CHAPTER_UNAVAILABLE" ? 404
    : classified.code === "CONTENT_RESTRICTED" ? 403 : classified.code === "MAPPING_UNAVAILABLE" ? 409 : 503);
  return { body: { error: { message: classified.message, code: classified.code, sourceId, stage } }, status,
    headers: classified.retryAfterSeconds ? { "Retry-After": String(classified.retryAfterSeconds) } : undefined };
}
