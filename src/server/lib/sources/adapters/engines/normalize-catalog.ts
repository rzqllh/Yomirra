import type { MangaPageResult } from "@/shared/sources/source-types";
import { SourceError } from "../../error";

/** Validate staged metadata without adding network access or inferring ratings. */
export function sameProviderUrl(raw: unknown, base: string): URL | null {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 2048 ||
      /[\u0000-\u0020\\]/.test(raw) || /(?:^|\/)\.\.?(?:\/|$)/.test(raw) ||
      /%(?:2f|5c|2e)/i.test(raw) || raw.startsWith("//")) return null;
  try {
    const url = new URL(raw, base + "/");
    const origin = new URL(base).origin;
    return url.protocol === "https:" && url.origin === origin && url.pathname !== "/" &&
      !url.username && !url.password && !url.hash ? url : null;
  } catch { return null; }
}

export function normalizeStagedMediaUrl(raw: unknown, base: string): string {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 2048 || /[\u0000-\u001f\\]/.test(raw)) return "";
  try {
    const url = new URL(raw.trim(), base + "/");
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash ? url.href : "";
  } catch { return ""; }
}

export function normalizeStagedCatalog(result: MangaPageResult, base: string, sourceId: string): MangaPageResult {
  if (!result || !Array.isArray(result.mangas) || typeof result.hasNextPage !== "boolean") {
    throw new SourceError("Invalid staged listing schema", { sourceId, code: "SCHEMA_CHANGED", stage: "search" });
  }
  const seen = new Map<string, string>();
  const mangas: MangaPageResult["mangas"] = [];
  for (const manga of result.mangas) {
    if (!manga || typeof manga.id !== "string" || !manga.id.trim() ||
        !sameProviderUrl(manga.id, base) || typeof manga.title !== "string" || !manga.title.trim()) {
      throw new SourceError("Invalid staged listing identity", { sourceId, code: "SCHEMA_CHANGED", stage: "search" });
    }
    const title = manga.title.trim().replace(/\s+/g, " ");
    const evidence = JSON.stringify([title, manga.contentRating, manga.isNsfw]);
    const previous = seen.get(manga.id);
    if (previous !== undefined) {
      if (previous !== evidence) throw new SourceError("Conflicting staged listing identity", { sourceId, code: "SCHEMA_CHANGED", stage: "search" });
      continue;
    }
    seen.set(manga.id, evidence);
    mangas.push({ ...manga, title, coverUrl: normalizeStagedMediaUrl(manga.coverUrl, base) });
  }
  return { mangas, hasNextPage: result.hasNextPage };
}
