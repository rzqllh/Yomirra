import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { CACHE_TTL, getSourceCacheKey, withCache } from "@/server/lib/cache/redis-cache";
import { CONTENT_PREFERENCE_COOKIE, DATA_SAVER_COOKIE, LANGUAGE_PREFERENCE_COOKIE, isContentVisible, isSourceContentVisible, shouldHideNsfw, sourceReadScope } from "@/shared/sources/content-policy";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import type { MangaSource, SourceReadOptions } from "@/shared/sources/source-types";
import { SourceError } from "./error";

export function getRequestReadOptions(request: NextRequest): SourceReadOptions {
  const params = request.nextUrl.searchParams;
  const languages = parseLanguages(params.get("languages") ?? request.cookies?.get(LANGUAGE_PREFERENCE_COOKIE)?.value);
  // URL parameters can make the content filter stricter but cannot opt a
  // visitor into adult content without their own persisted cookie.
  const cookieHideNsfw = shouldHideNsfw(request.cookies?.get(CONTENT_PREFERENCE_COOKIE)?.value);
  const queryHideNsfw = params.get("hideNsfw");
  return {
    hideNsfw: cookieHideNsfw || (queryHideNsfw !== null && queryHideNsfw !== "false"),
    preferredLanguages: languages?.length ? languages.slice(0, 5) : undefined,
    dataSaver: (params.get("dataSaver") ?? request.cookies?.get(DATA_SAVER_COOKIE)?.value) === "true",
  };
}

export async function getServerReadOptions(): Promise<SourceReadOptions> {
  const cookieStore = await cookies();
  return {
    hideNsfw: shouldHideNsfw(cookieStore.get(CONTENT_PREFERENCE_COOKIE)?.value),
    preferredLanguages: parseLanguages(cookieStore.get(LANGUAGE_PREFERENCE_COOKIE)?.value),
    dataSaver: cookieStore.get(DATA_SAVER_COOKIE)?.value === "true",
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
  return getSourceCacheKey(source, operation, `content-v1:${sourceReadScope(options)}:${params}`);
}

export async function loadSourceCatalog(source: MangaSource, operation: "popular" | "latest", page: number, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  const result = await withCache(contentCacheKey(source, operation, String(page), options),
    () => operation === "popular" ? source.getPopular(page, options) : source.getLatest(page, options), CACHE_TTL.DISCOVERY);
  return { ...result, mangas: result.mangas.filter((item) => isContentVisible(item, options.hideNsfw !== false)) };
}

export async function loadSourceDetail(source: MangaSource, mangaId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  const detail = await withCache(contentCacheKey(source, "manga", mangaId, options), () => source.getDetail(mangaId, options), CACHE_TTL.DETAIL);
  if (!isContentVisible(detail, options.hideNsfw !== false)) {
    throw new SourceError("Konten disembunyikan oleh pengaturan konten", {
      code: "CONTENT_RESTRICTED", sourceId: source.id, stage: "detail", statusCode: 403,
    });
  }
  return detail;
}

export async function loadSourceChapters(source: MangaSource, mangaId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  return withCache(contentCacheKey(source, "chapters", mangaId, options), () => source.getChapters(mangaId, options), CACHE_TTL.CHAPTERS);
}

export async function loadSourcePages(source: MangaSource, mangaId: string, chapterId: string, options: SourceReadOptions = {}) {
  assertSourceAccess(source, options);
  // MangaDex @Home URLs expire. Never revive an expired URL from stale-on-error cache.
  return withCache(contentCacheKey(source, "pages", `${mangaId}:${chapterId}`, options),
    () => source.getPages(chapterId, { ...options, mangaId }), source.id === "mangadex" ? 300 : CACHE_TTL.PAGES,
    { allowStaleOnError: source.id !== "mangadex" });
}

export function sourceErrorResponse(error: unknown, sourceId: string, stage: "search" | "detail" | "chapters" | "pages" = "detail") {
  const classified = SourceError.classify(error, sourceId, stage);
  const status = classified.statusCode ?? (classified.code === "RATE_LIMITED" ? 429
    : classified.code === "CONTENT_NOT_FOUND" || classified.code === "CHAPTER_UNAVAILABLE" ? 404
    : classified.code === "CONTENT_RESTRICTED" ? 403 : classified.code === "MAPPING_UNAVAILABLE" ? 409 : 503);
  return { body: { error: { message: classified.message, code: classified.code, sourceId, stage } }, status };
}
