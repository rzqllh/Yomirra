import type { MangaItem, SourceMetadata, SourceReadOptions } from "./source-types";

export const CONTENT_PREFERENCE_COOKIE = "yomirra-hide-nsfw";
export const LANGUAGE_PREFERENCE_COOKIE = "yomirra-source-languages";
export const DATA_SAVER_COOKIE = "yomirra-data-saver";

/** Missing/invalid preferences always keep restricted content hidden. */
export function shouldHideNsfw(value?: string | null): boolean {
  return value !== "false";
}

export function isContentVisible(item: Pick<MangaItem, "contentRating" | "isNsfw">, hideNsfw = true): boolean {
  if (!hideNsfw) return true;
  if (item.isNsfw === true) return false;
  return item.contentRating === undefined || item.contentRating === "safe";
}

export function isSourceContentVisible(source: Pick<SourceMetadata, "isNsfw">, hideNsfw = true): boolean {
  return !hideNsfw || source.isNsfw !== true;
}

export function sourceReadScope(options: SourceReadOptions = {}): string {
  return JSON.stringify({
    safety: options.hideNsfw !== false ? "safe-v1" : "opt-in-v1",
    languages: options.preferredLanguages ?? ["id", "en"],
    dataSaver: options.dataSaver === true,
  });
}
