import { HttpClient } from "../base/http-client";
import { SourceError } from "../../error";
import type {
  Chapter, ChapterPages, FilterList, MangaDetail, MangaItem,
  MangaPageResult, MangaSource, SourceMetadata,
} from "@/shared/sources/source-types";
import type { KeiyoushiCandidate } from "@/shared/sources/keiyoushi-candidates";

type JsonRecord = Record<string, unknown>;
const asRecord = (value: unknown): JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const str = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);
const urlString = (value: unknown): string => {
  const raw = str(value);
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch { return ""; }
};
const numberValue = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function statusValue(raw: unknown): MangaDetail["status"] {
  const value = str(raw).toLowerCase();
  if (value.includes("complet") || value.includes("finish")) return "COMPLETED";
  if (value.includes("cancel")) return "CANCELLED";
  if (value.includes("ongoing")) return "ONGOING";
  return "UNKNOWN";
}

function segment(id: string): string {
  if (!/^[a-zA-Z0-9._-]{1,200}$/.test(id)) {
    throw new SourceError("Invalid provider resource ID", { code: "CONTENT_NOT_FOUND" });
  }
  return encodeURIComponent(id);
}

/**
 * API prototypes based on the owner's ZIP assumptions. They are disabled and
 * diagnostic-only until upstream response schemas, licenses and reader parity
 * have been independently verified. No auth/paywall circumvention.
 */
export class KeiyoushiApiAdapter implements MangaSource {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly description = "Experimental API port, requires upstream parity verification.";
  readonly language = "id";
  readonly version = "0.1.0-in-dev";
  readonly isEnabled = false;
  readonly isInstalled = true;
  readonly status = "in-dev" as const;
  readonly isNsfw = false;
  readonly isDynamic = false;
  readonly capabilities: SourceMetadata["capabilities"] = {
    popular: false, latest: false, search: true, detail: true,
    chapters: true, pages: true, filters: false,
  };
  private readonly client: HttpClient;

  constructor(readonly candidate: KeiyoushiCandidate, client?: HttpClient) {
    if (candidate.engine !== "api") throw new Error("Only dedicated API candidates are supported");
    this.id = candidate.id;
    this.name = candidate.name;
    this.baseUrl = candidate.baseUrl;
    this.client = client ?? new HttpClient({
      baseUrl: candidate.baseUrl,
      allowedHosts: [new URL(candidate.baseUrl).hostname],
      timeoutMs: 10_000, maxRedirects: 2, maxResponseSize: 4 * 1024 * 1024,
    });
  }

  private async get(path: string): Promise<JsonRecord> {
    const value = await this.client.get<unknown>(path);
    const record = asRecord(value);
    if (Object.keys(record).length === 0) {
      throw new SourceError("Upstream API response does not match object contract", {
        code: "PARSER_BROKEN", sourceId: this.id,
      });
    }
    return record;
  }

  private mangaItem(value: unknown): MangaItem {
    const obj = asRecord(value);
    const title = str(obj.title || obj.name);
    return {
      id: str(obj.id || obj.titleId || obj.comicId),
      title,
      coverUrl: urlString(obj.thumbnail || obj.cover || obj.portraitImageUrl),
      description: str(obj.description || obj.overview),
      contentRating: "unknown",
      isNsfw: false,
      language: "id",
    };
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const q = query.trim().slice(0, 120);
    const safePage = Math.max(1, Math.min(100, Math.floor(page) || 1));
    let values: unknown[] = [];
    if (this.id === "ainzscansid") {
      const data = await this.get("/search?keyword=" + encodeURIComponent(q));
      if (!Array.isArray(data.results)) throw new SourceError("Ainz search schema not verified", { code: "PARSER_BROKEN", sourceId: this.id });
      values = data.results;
    } else if (this.id === "mangatoon-limited") {
      const data = await this.get("/content/search?word=" + encodeURIComponent(q) + "&page=" + safePage + "&pageSize=20&language=id");
      const list = asRecord(data.data).comics;
      if (!Array.isArray(list)) throw new SourceError("MangaToon search schema not verified", { code: "PARSER_BROKEN", sourceId: this.id });
      values = list;
    } else if (this.id === "manga-plus-by-shueisha") {
      const data = await this.get("/title_list/allV2?format=json");
      const groups = asArray(asRecord(asRecord(data.success).allTitlesViewV2).AllTitlesGroup);
      if (!groups.length) throw new SourceError("MANGA Plus title-list schema not verified", { code: "PARSER_BROKEN", sourceId: this.id });
      values = groups.flatMap(g => asArray(asRecord(g).titles)).filter(item => {
        const obj = asRecord(item);
        return str(obj.name).toLowerCase().includes(q.toLowerCase()) &&
          ["IND", "INDONESIAN"].includes(str(obj.language));
      });
      values = values.slice((safePage - 1) * 30, safePage * 30);
    }
    const mangas = values.map(v => this.mangaItem(v)).filter(v => v.id && v.title).slice(0, 30);
    return { mangas, hasNextPage: mangas.length >= 30 };
  }

  getPopular(page: number): Promise<MangaPageResult> {
    return this.search("", page);
  }

  getLatest(page: number): Promise<MangaPageResult> {
    return this.search("", page);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const id = segment(mangaId);
    let data: JsonRecord;
    if (this.id === "ainzscansid") data = await this.get("/detail/" + id);
    else if (this.id === "mangatoon-limited") data = asRecord((await this.get("/content/comic/detail?id=" + id + "&language=id")).data);
    else data = asRecord(asRecord((await this.get("/title_detailV3?title_id=" + id + "&format=json")).success).titleDetailView);
    const manga = this.mangaItem(this.id === "manga-plus-by-shueisha" ? asRecord(data.title) : data);
    if (!manga.title) throw new SourceError("API detail missing title", { code: "PARSER_BROKEN", sourceId: this.id, stage: "detail" });
    return {
      ...manga, id: manga.id || mangaId, description: str(data.description || data.overview || manga.description),
      genres: asArray(data.genres).map(str).filter(Boolean),
      status: statusValue(data.status || (data.is_finish ? "COMPLETED" : "ONGOING")),
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const id = segment(mangaId);
    let values: unknown[] = [];
    if (this.id === "ainzscansid") {
      const data = await this.get("/chapters/" + id);
      if (!Array.isArray(data.chapters)) throw new SourceError("Ainz chapters schema mismatch", { code: "PARSER_BROKEN", sourceId: this.id, stage: "chapters" });
      values = data.chapters;
    } else if (this.id === "mangatoon-limited") {
      const data = await this.get("/content/comic/episodes?id=" + id + "&language=id");
      const episodes = asRecord(data.data).episodes;
      if (!Array.isArray(episodes)) throw new SourceError("MangaToon episodes schema mismatch", { code: "PARSER_BROKEN", sourceId: this.id, stage: "chapters" });
      values = episodes;
    } else {
      const detail = asRecord(asRecord((await this.get("/title_detailV3?title_id=" + id + "&format=json")).success).titleDetailView);
      values = [...asArray(detail.firstTitleList), ...asArray(detail.lastTitleList)];
      if (!values.length) throw new SourceError("MANGA Plus chapter list is unavailable", { code: "CHAPTER_UNAVAILABLE", sourceId: this.id, stage: "chapters" });
    }
    return values.slice(0, 2000).map((v, index) => {
      const c = asRecord(v);
      const chapter = str(c.id || c.chapterId);
      const title = str(c.title || c.name || c.subTitle || ("Chapter " + (index + 1)));
      return {
        id: this.id === "ainzscansid" ? mangaId + "::" + chapter : chapter,
        mangaId, title,
        number: numberValue(c.number || c.order || (title.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] ?? 0)),
        date: "", isLocked: c.isLocked === true || c.is_free === false,
      };
    }).filter(ch => ch.id && ch.id !== mangaId + "::");
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    let path: string;
    if (this.id === "ainzscansid") {
      const match = chapterId.match(/^([a-zA-Z0-9._-]{1,200})::([a-zA-Z0-9._-]{1,200})$/);
      if (!match) throw new SourceError("Invalid Ainz chapter ID", { code: "CONTENT_NOT_FOUND", sourceId: this.id, stage: "pages" });
      path = "/pages/" + segment(match[1]) + "/" + segment(match[2]);
    } else if (this.id === "mangatoon-limited") {
      path = "/content/comic/pictures?episode_id=" + segment(chapterId) + "&language=id";
    } else {
      path = "/manga_viewer?chapter_id=" + segment(chapterId) + "&img_quality=high&format=json";
    }
    const data = await this.get(path);
    let values: unknown[];
    if (this.id === "ainzscansid") values = asArray(data.pages).map(item => asRecord(item).url);
    else if (this.id === "mangatoon-limited") values = asArray(asRecord(data.data).pictures).map(item => asRecord(item).url);
    else values = asArray(asRecord(asRecord(data.success).mangaViewer).pages).map(item => asRecord(asRecord(item).mangaPage).imageUrl);
    return {
      chapterId,
      pages: values.map(urlString).filter(Boolean).slice(0, 500).map((url, index) => ({ index, url })),
    };
  }

  getFilters(): FilterList {
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
