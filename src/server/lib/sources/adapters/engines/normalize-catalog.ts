import type { Chapter, MangaPageResult } from "@/shared/sources/source-types";
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

/** Reject conflicting duplicate chapter identities rather than guessing
 * which lock state or title is authoritative. Preserve source-local order. */
export function normalizeStagedChapters(
  chapters: readonly Chapter[], mangaId: string, base: string, sourceId: string,
): Chapter[] {
  const seen = new Map<string, Chapter>();
  for (const row of chapters) {
    const url = sameProviderUrl(row.url ?? row.id, base);
    if (!url || url.search || row.mangaId !== mangaId || !row.title.trim() ||
        !Number.isFinite(row.number) || row.number < 0) {
      throw new SourceError("Invalid chapter identity", { sourceId, code: "SCHEMA_CHANGED", stage: "chapters" });
    }
    const id = url.pathname.replace(/^\/|\/$/g, "");
    const chapter = { ...row, id, title: row.title.trim(), url: url.href };
    const previous = seen.get(id);
    if (previous && (previous.title !== chapter.title || previous.number !== chapter.number ||
        previous.isLocked !== chapter.isLocked)) {
      throw new SourceError("Conflicting chapter identity", { sourceId, code: "SCHEMA_CHANGED", stage: "chapters" });
    }
    if (!previous) seen.set(id, chapter);
  }
  return [...seen.values()];
}
