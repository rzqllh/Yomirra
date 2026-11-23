import * as cheerio from "cheerio";
import { HttpClient } from "../base/http-client";
import type {
  Chapter, ChapterPages, FilterList, MangaDetail, MangaItem,
  MangaPageResult, MangaSource, SourceMetadata,
} from "@/shared/sources/source-types";
import type { KeiyoushiCandidate } from "@/shared/sources/keiyoushi-candidates";
import { keiyoushiNeedsRestrictedOptIn } from "@/shared/sources/keiyoushi-candidates";
import { SourceError } from "../../error";

const MAX_CATALOG_ITEMS = 50;
const MAX_CHAPTERS = 2000;
const MAX_PAGES = 500;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

function textContent(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function mediaUrl(raw: string | undefined, baseUrl: string): string {
  if (!raw || raw.length > 2048) return "";
  try {
    const url = new URL(raw.trim(), baseUrl + "/");
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

function statusFromText(text: string): MangaDetail["status"] {
  const normalized = text.toLowerCase();
  if (/\b(completed|complete|tamat|end)\b/.test(normalized)) return "COMPLETED";
  if (/\b(cancelled|canceled|dropped)\b/.test(normalized)) return "CANCELLED";
  if (/\b(ongoing|berlanjut)\b/.test(normalized)) return "ONGOING";
  return "UNKNOWN";
}

/**
 * Extract only the JSON argument passed to ts_reader.run. Does not evaluate JS.
 * Balances braces outside quoted strings so nested reader payloads are accepted.
 */
export function extractTsReaderImages(html: string): string[] {
  const marker = "ts_reader.run(";
  const pos = html.indexOf(marker);
  if (pos < 0) return [];
  const start = html.indexOf("{", pos + marker.length);
  if (start < 0 || start - pos > 128) return [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length && i - start < 256_000; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) {
      try {
        const parsed: unknown = JSON.parse(html.slice(start, i + 1));
        const sources = (parsed as { sources?: Array<{ images?: unknown }> })?.sources;
        const images = sources?.[0]?.images;
        return Array.isArray(images)
          ? images.filter((value): value is string => typeof value === "string")
          : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Experimental HTML adapter using Yomirra's bounded, SSRF-protected HttpClient.
 * Never exposed to discovery while its candidate is in-dev/disabled.
 * Its output is NOT proof of functional upstream parity.
 */
export class KeiyoushiHtmlAdapter implements MangaSource {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly description: string;
  readonly language = "id";
  readonly version = "0.1.0-in-dev";
  readonly isEnabled = false;
  readonly isInstalled = true;
  readonly status = "in-dev" as const;
  readonly isNsfw: boolean;
  readonly isDynamic = false;
  readonly capabilities: SourceMetadata["capabilities"] = {
    popular: true, latest: true, search: true, detail: true,
    chapters: true, pages: true, filters: false,
  };
  private readonly client: HttpClient;

  constructor(readonly candidate: KeiyoushiCandidate, client?: HttpClient) {
    if (candidate.engine === "api") throw new Error("API candidate requires a dedicated adapter");
    this.id = candidate.id;
    this.name = candidate.name;
    this.baseUrl = candidate.baseUrl.replace(/\/+$/, "");
    this.description = "Experimental Keiyoushi port. Not verified or enabled.";
    this.isNsfw = keiyoushiNeedsRestrictedOptIn(candidate);
    const host = new URL(this.baseUrl).hostname;
    this.client = client ?? new HttpClient({
      baseUrl: this.baseUrl,
      allowedHosts: [host],
      timeoutMs: 10_000,
      maxResponseSize: MAX_HTML_BYTES,
      maxRedirects: 2,
    });
  }

  private sameOriginPath(raw: string): string {
    if (!raw || raw.length > 2048 || raw.startsWith("//")) {
      throw new SourceError("Invalid source URL", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    }
    let url: URL;
    try {
      url = new URL(raw, this.baseUrl + "/");
    } catch {
      throw new SourceError("Invalid source URL", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    }
    if (url.protocol !== "https:" || url.origin !== new URL(this.baseUrl).origin ||
        url.username || url.password) {
      throw new SourceError("External source URL rejected", { sourceId: this.id, code: "UPSTREAM_BLOCKED" });
    }
    return url.pathname + url.search;
  }

  private detailPath(id: string): string {
    const raw = id.includes("/") || id.startsWith("http")
      ? id
      : "/manga/" + encodeURIComponent(id) + "/";
    return this.sameOriginPath(raw);
  }

  private async catalog(path: string): Promise<MangaPageResult> {
    const html = await this.client.getHtml(this.sameOriginPath(path));
    const $ = cheerio.load(html);
    const mangas: MangaItem[] = [];
    const seen = new Set<string>();

    $(".bsx, .page-item-detail, .listupd .bs, .c-tabs-item__content, .listupd article, .post-content_item, .bs, .list-item").each((_, element) => {
      if (mangas.length >= MAX_CATALOG_ITEMS) return false;
      const item = $(element);
      const anchor = item.find("a[href]").filter((_, el) => {
        const href = $(el).attr("href") ?? "";
        return /\/(manga|komik|comic|series)\//i.test(href);
      }).first();
      const href = anchor.attr("href");
      if (!href) return;
      let id: string;
      try { id = this.sameOriginPath(href); } catch { return; }
      if (seen.has(id)) return;
      const title = textContent(
        item.find("h3, h4, .tt, .post-title, .title").first().text() ||
        anchor.attr("title") || item.find("img").first().attr("alt") || ""
      );
      if (!title) return;
      const image = item.find("img").first();
      const cover = mediaUrl(image.attr("data-src") || image.attr("data-lazy-src") || image.attr("src"), this.baseUrl);
      seen.add(id);
      mangas.push({
        id, title, coverUrl: cover, language: "id",
        isNsfw: this.isNsfw,
        contentRating: this.isNsfw ? "unknown" : "unknown",
      });
    });
    const hasNextPage = $(".next.page-numbers, a.next, a[rel='next']").length > 0;
    return { mangas, hasNextPage };
  }

  getPopular(page: number): Promise<MangaPageResult> {
    const p = Math.max(1, Math.min(100, Math.floor(page) || 1));
    return this.catalog("/manga/?order=popular&page=" + p);
  }

  getLatest(page: number): Promise<MangaPageResult> {
    const p = Math.max(1, Math.min(100, Math.floor(page) || 1));
    return this.catalog("/manga/?page=" + p);
  }

  search(query: string, page: number): Promise<MangaPageResult> {
    const q = query.trim().slice(0, 120);
    const p = Math.max(1, Math.min(100, Math.floor(page) || 1));
    return this.catalog("/?s=" + encodeURIComponent(q) + "&post_type=wp-manga&paged=" + p);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const html = await this.client.getHtml(this.detailPath(mangaId));
    const $ = cheerio.load(html);
    const title = textContent($("h1.entry-title, h1.post-title, h1").first().text());
    if (!title) {
      throw new SourceError("Manga detail parser returned no title", {
        sourceId: this.id, stage: "detail", code: "PARSER_BROKEN",
      });
    }
    const desc = textContent(
      $(".summary__content, .description-summary, .entry-content-single, .summary__content p, .synopsis").first().text()
    );
    const coverEl = $(".summary_image img, .thumb img, .manga-thumb img, .profile-manga img").first();
    const coverUrl = mediaUrl(coverEl.attr("data-src") || coverEl.attr("src"), this.baseUrl);
    const genres = Array.from(new Set(
      $(".genres-content a, .mgen a, a[href*='/genres/'], a[href*='/genre/']")
        .toArray().map(el => textContent($(el).text())).filter(Boolean)
    ));
    const status = statusFromText($(".post-status, .summary-content, .imptdt").text());
    return {
      id: mangaId, title, coverUrl, description: desc,
      genres, status, language: "id", isNsfw: this.isNsfw,
      contentRating: "unknown",
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.client.getHtml(this.detailPath(mangaId));
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];
    const seen = new Set<string>();
    $("#chapterlist li a, .wp-manga-chapter a, .eplister li a, .chapter-list li a, .listing-chapters_wrap a").each((_, el) => {
      if (chapters.length >= MAX_CHAPTERS) return false;
      const a = $(el);
      const href = a.attr("href");
      if (!href) return;
      let id: string;
      try { id = this.sameOriginPath(href); } catch { return; }
      if (seen.has(id)) return;
      const title = textContent(a.find(".chapternum").text() || a.text());
      if (!title) return;
      seen.add(id);
      const match = title.match(/(?:chapter|ch\.?|episode|ep\.?)\s*([0-9]+(?:\.[0-9]+)?)/i);
      chapters.push({
        id, mangaId, title, number: match ? Number(match[1]) : 0,
        date: textContent(a.closest("li").find(".chapter-release-date, .chapterdate, .date").text()),
        url: new URL(id, this.baseUrl).toString(),
      });
    });
    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const html = await this.client.getHtml(this.sameOriginPath(chapterId));
    const $ = cheerio.load(html);
    const urls: string[] = [];
    const seen = new Set<string>();
    const rawUrls = extractTsReaderImages(html);
    if (rawUrls.length === 0) {
      $("#readerarea img, #reader-area img, .reading-content img, .page-break img, img.wp-manga-chapter-img, .reader-area img")
        .each((_, el) => {
          const img = $(el);
          rawUrls.push(img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "");
        });
    }
    for (const raw of rawUrls) {
      if (urls.length >= MAX_PAGES) break;
      const url = mediaUrl(raw, this.baseUrl);
      if (url && !seen.has(url)) { urls.push(url); seen.add(url); }
    }
    return {
      chapterId,
      pages: urls.map((url, index) => ({ index, url, referer: this.baseUrl + "/" })),
    };
  }

  getFilters(): FilterList {
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
