import type { Chapter, ChapterPages, MangaPageResult, PageItem } from "@/shared/sources/source-types";
import { SourceError } from "../../error";
import type { CheerioAPI } from "cheerio";

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

/** A missing lock marker is not affirmative unlocked evidence. Positive
 * lock evidence always wins; explicit data-locked=false may establish
 * unlocked status, but never an unknown/contradictory attribute. */
export function stagedChapterLock(markedLocked:boolean,...values:(string|undefined)[]):boolean|undefined{
  const present=values.filter((v):v is string=>v!==undefined).map(v=>v.trim().toLowerCase());
  if(markedLocked||present.includes("true"))return true;
  return present.length>0&&present.every(v=>v==="false")?false:undefined;
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
        previous.isLocked !== chapter.isLocked || previous.chapterNumber !== chapter.chapterNumber ||
        previous.volume !== chapter.volume || previous.language !== chapter.language)) {
      throw new SourceError("Conflicting chapter identity", { sourceId, code: "SCHEMA_CHANGED", stage: "chapters" });
    }
    if (!previous) seen.set(id, chapter);
  }
  return [...seen.values()];
}

/** Normalize reader references without fetching images, guessing page
 * content, or discarding malformed entries from an otherwise valid list. */
export function normalizeStagedPages(
  chapterId: string, pages: readonly PageItem[], chapterPath: string, base: string, sourceId: string,
): ChapterPages {
  const chapterUrl = sameProviderUrl(chapterPath, base);
  if (!chapterUrl || pages.length === 0 || pages.length > 500) {
    throw new SourceError("Page references unavailable", { sourceId, code: "PARSER_BROKEN", stage: "pages" });
  }
  return {
    chapterId,
    pages: pages.map((page, index) => {
      if (typeof page.url !== "string" || !page.url.trim() || page.url.length > 2048 ||
          /[\u0000-\u001f\\]/.test(page.url)) {
        throw new SourceError("Invalid page reference", { sourceId, code: "SCHEMA_CHANGED", stage: "pages" });
      }
      let url: URL;
      try {
        url = new URL(page.url.trim(), chapterUrl);
      } catch {
        throw new SourceError("Invalid page reference", { sourceId, code: "SCHEMA_CHANGED", stage: "pages" });
      }
      if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) {
        throw new SourceError("Invalid page reference", { sourceId, code: "SCHEMA_CHANGED", stage: "pages" });
      }
      return { ...page, index: index + 1, url: url.href };
    }),
  };
}

/** Only explicit format values qualify as identity evidence. Never infer
 * manga/manhwa/manhua from provider country, language or genre. */
export function stagedComicFormat(value: unknown): "manga"|"manhwa"|"manhua"|undefined {
  if (typeof value !== "string") return undefined;
  const v=value.trim().toLowerCase();
  return v==="manga"||v==="manhwa"||v==="manhua"?v:undefined;
}

/** Read labeled work metadata, excluding unrelated article/reader content. */
export function stagedDetailIdentity($:CheerioAPI) {
  const types:string[]=[];
  const names:string[]=[];
  function collect(label:string,value:string){
    const key=label.trim().replace(/:\s*$/,"").toLowerCase();
    if(["type","format","tipe","jenis"].includes(key))types.push(value.trim());
    if(["alternative","alternative title","alternative titles","alt title","judul alternatif","judul lain"].includes(key)){
      for(const name of value.split(/\s*[;\n]\s*|\s+\|\s+/)){
        const title=name.trim();
        if(title&&title.length<=300&&!/^(?:n\/a|none|unknown|-\s*)$/i.test(title))names.push(title);
      }
    }
  }
  $(".tsinfo .imptdt, .infotable tr, .post-content_item, .seriestucontent").each((_,el)=>{
    const row=$(el);
    const label=row.find(".summary-heading, th").first().text().trim();
    const content=row.find(".summary-content, td").last().text().trim();
    if(label&&content){collect(label,content);return;}
    const inline=row.find("i").first();
    if(inline.length){
      const clone=row.clone();clone.find("i").remove();
      collect(clone.text(),inline.text());
    }
  });
  const normalized=types.map(stagedComicFormat);
  const unique=new Set(normalized);
  const format=unique.size===1&&normalized[0]?normalized[0]:undefined;
  const alternativeTitles=[...new Set(names)].slice(0,20);
  return {...(format?{format}:{}),...(alternativeTitles.length?{alternativeTitles}:{})};
}
