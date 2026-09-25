import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaPageResult,
  MangaSource,
} from "@/shared/sources/source-types";
import type { SourceCapabilities } from "@/shared/sources/source-capabilities";
import { HttpClient } from "../base/http-client";
import { decryptEnvelope } from "./crypto";
import type { KomikNesiaEnvelope } from "./types";
import {
  parseKomikNesiaContents,
  parseKomikNesiaDetail,
  parseKomikNesiaSearch,
} from "./compatibility-parser";
import {
  normalizeKomikNesiaChapter,
  normalizeKomikNesiaMangaDetail,
  normalizeKomikNesiaMangaItem,
  normalizeKomikNesiaPages,
} from "./normalizer";

/**
 * Generates an ephemeral device ID matching upstream's expected format.
 *
 * Format (VERIFIED_FROM_SOURCE): `dv_` + 8 random base36 chars + 6 timestamp chars
 * This contains no user fingerprint or stable PII — it is request-scoped.
 */
function generateDeviceId(): string {
  const randPart = Math.random().toString(36).substring(2, 10).padEnd(8, "0");
  const timePart = Date.now().toString(36).slice(-6);
  return `dv_${randPart}${timePart}`;
}

/**
 * Decodes a KomikNesia encrypted envelope into a typed payload.
 * Encryption details are fully contained in this adapter.
 */
function decode(envelope: KomikNesiaEnvelope): unknown {
  return decryptEnvelope(envelope);
}

function readChapterImages(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return [];
  const data = (raw as Record<string, unknown>).data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) return [];
  const images = (data as Record<string, unknown>).images;
  return Array.isArray(images)
    ? images.filter((image): image is string => typeof image === "string")
    : [];
}

export class KomikNesiaSource implements MangaSource {
  public readonly id = "komiknesia";
  public readonly name = "KomikNesia";
  public readonly description = "Baca Komik Bahasa Indonesia (Encrypted API)";
  public readonly language = "id";
  public readonly baseUrl = "https://api-be.komiknesia.my.id/api";
  public readonly upstreamDomain = "api-be.komiknesia.my.id";
  public readonly supportedLanguages = ["id"];
  public readonly version = "1.0.0";
  public readonly adapterVersion = "1.0.0";
  public readonly isEnabled = true;
  public readonly isInstalled = true;
  public readonly isNsfw = false;
  public readonly isDynamic = false;
  public readonly status = "online" as const;

  public readonly capabilities: SourceCapabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
    filters: false,
    multiLanguage: false,
    auth: false,
    related: false,
    download: true,
  };

  private client: HttpClient;

  constructor(client?: HttpClient) {
    this.client =
      client ??
      new HttpClient({
        baseUrl: this.baseUrl,
        timeoutMs: 15000,
        allowedHosts: ["api-be.komiknesia.my.id"],
        defaultHeaders: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://komiknesia.site/",
          Accept: "application/json",
        },
      });
  }

  private makeHeaders(): Record<string, string> {
    return { "X-Device-Id": generateDeviceId() };
  }

  private async fetchDecrypted(
    path: string,
    params?: Record<string, string | number | boolean | string[]>
  ): Promise<unknown> {
    const envelope = await this.client.get<KomikNesiaEnvelope>(path, params, {
      headers: this.makeHeaders(),
    });

    if (!envelope || typeof envelope !== "object") {
      throw new Error("KOMIKNESIA_INVALID_ENVELOPE: Response is not a JSON object");
    }

    if (envelope.status === false) {
      throw new Error("KOMIKNESIA_INVALID_ENVELOPE: API returned status=false");
    }

    return decode(envelope);
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const raw = await this.fetchDecrypted("/contents", {
      page: pageNum,
      limit: 20,
    });
    const { items, totalPages } = parseKomikNesiaContents(raw);
    const hasNextPage = pageNum < totalPages;

    return {
      mangas: items.map(normalizeKomikNesiaMangaItem),
      hasNextPage,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    // /contents returns content ordered by update time — this is the "latest" feed
    return this.getPopular(page);
  }

  async search(
    query: string,
    page: number,
    _filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    const trimmedQuery = query?.trim() || "";
    const pageNum = Math.max(1, page || 1);

    const params: Record<string, string | number> = { page: pageNum, limit: 20 };
    if (trimmedQuery.length > 0) {
      params.search = trimmedQuery;
    }

    const raw = await this.fetchDecrypted("/manga", params);
    const { items, totalPages } = parseKomikNesiaSearch(raw);
    const hasNextPage = pageNum < totalPages;

    return {
      mangas: items.map(normalizeKomikNesiaMangaItem),
      hasNextPage,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error(
        `INVALID_MANGA_ID: KomikNesia requires a manga slug, got "${mangaId}"`
      );
    }

    const raw = await this.fetchDecrypted(
      `/manga/slug/${encodeURIComponent(slug)}`
    );
    const detail = parseKomikNesiaDetail(raw);

    return normalizeKomikNesiaMangaDetail(detail);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error(
        `INVALID_MANGA_ID: KomikNesia requires a manga slug, got "${mangaId}"`
      );
    }

    // Detail endpoint embeds the full chapter list — avoids a second request
    const raw = await this.fetchDecrypted(
      `/manga/slug/${encodeURIComponent(slug)}`
    );
    const chapters = parseKomikNesiaDetail(raw).chapters;
    if (!Array.isArray(chapters)) return [];

    return chapters.map((c) => normalizeKomikNesiaChapter(c, slug));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const slug = chapterId?.trim();
    if (!slug) {
      throw new Error(
        `INVALID_CHAPTER_ID: KomikNesia requires a chapter slug, got "${chapterId}"`
      );
    }

    const raw = await this.fetchDecrypted(
      `/chapters/slug/${encodeURIComponent(slug)}`
    );
    const images = readChapterImages(raw);
    if (images.length === 0) {
      return { chapterId, pages: [] };
    }

    return normalizeKomikNesiaPages(images, chapterId);
  }

  async getFilters(): Promise<FilterList> {
    // KomikNesia upstream does not expose a verified filter/genre endpoint
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
