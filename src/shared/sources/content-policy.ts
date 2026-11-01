import type { MangaItem, SourceMetadata, SourceReadOptions } from "./source-types";

export const CONTENT_PREFERENCE_COOKIE = "yomirra-hide-nsfw";
export const LANGUAGE_PREFERENCE_COOKIE = "yomirra-source-languages";
export const DATA_SAVER_COOKIE = "yomirra-data-saver";

/** Missing/invalid preferences always keep restricted content hidden. */
export function shouldHideNsfw(value?: string | null): boolean {
  return value !== "false";
}

export type ContentClassification = "SAFE" | "NSFW" | "UNKNOWN";

/**
 * A missing provider rating is not evidence that a title is safe.
 * Keep suggestive content restricted in safe mode (existing behavior).
 */
export function classifyContent(item: Pick<MangaItem, "contentRating" | "isNsfw">): ContentClassification {
  if (item.isNsfw === true || item.contentRating === "suggestive" ||
      item.contentRating === "erotica" || item.contentRating === "pornographic") return "NSFW";
  if (item.contentRating === "safe") return "SAFE";
  return "UNKNOWN";
}

export function isContentVisible(item: Pick<MangaItem, "contentRating" | "isNsfw">, hideNsfw = true): boolean {
  if (!hideNsfw) return true;
  return classifyContent(item) !== "NSFW";
}

export function isSourceContentVisible(source: Pick<SourceMetadata, "isNsfw">, hideNsfw = true): boolean {
  return !hideNsfw || source.isNsfw !== true;
}

export function sourceReadScope(options: SourceReadOptions = {}): string {
  return JSON.stringify({
    safety: options.hideNsfw !== false ? "safe-v2" : "opt-in-v1",
    languages: options.preferredLanguages ?? ["id", "en"],
    dataSaver: options.dataSaver === true,
  });
}
