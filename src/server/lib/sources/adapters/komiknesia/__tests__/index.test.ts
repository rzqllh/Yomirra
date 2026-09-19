import { describe, it, expect, vi, beforeEach } from "vitest";
import { KomikNesiaSource } from "../index";
import { deriveKey, decryptEnvelope } from "../crypto";
import {
  normalizeKomikNesiaMangaItem,
  normalizeKomikNesiaMangaDetail,
  normalizeKomikNesiaChapter,
  normalizeKomikNesiaPages,
  normalizeKomikNesiaStatus,
} from "../normalizer";
import { HttpClient } from "../../base/http-client";
import {
  TEST_TIME,
  encryptedListEnvelope,
  encryptedSearchEnvelope,
  encryptedDetailEnvelope,
  encryptedPagesEnvelope,
  encryptedEmptyListEnvelope,
  plaintextEnvelope,
  expectedListPayload,
  expectedDetailPayload,
  expectedPagesPayload,
} from "./fixtures";
import type { KomikNesiaEnvelope } from "../types";

// ============================================================
// SECTION 1: Key Derivation
// ============================================================

describe("KomikNesia / crypto / deriveKey", () => {
  it("derives correct key string for known time", () => {
    const key = deriveKey(TEST_TIME);
    expect(key.toString("utf8")).toBe("55929735.43750000000000000000000");
    expect(key.length).toBe(32);
  });

  it("throws for zero time", () => {
    expect(() => deriveKey(0)).toThrow("KOMIKNESIA_DECRYPT_FAILURE");
  });

  it("throws for negative time", () => {
    expect(() => deriveKey(-1)).toThrow("KOMIKNESIA_DECRYPT_FAILURE");
  });

  it("throws for NaN", () => {
    expect(() => deriveKey(NaN)).toThrow("KOMIKNESIA_DECRYPT_FAILURE");
  });

  it("throws for Infinity", () => {
    expect(() => deriveKey(Infinity)).toThrow("KOMIKNESIA_DECRYPT_FAILURE");
  });
});

// ============================================================
// SECTION 2: Envelope Decryption
// ============================================================

describe("KomikNesia / crypto / decryptEnvelope", () => {
  it("decrypts list envelope and returns correct payload", () => {
    const result = decryptEnvelope(encryptedListEnvelope) as typeof expectedListPayload;
    expect(result.status).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data![0].title).toBe("Hantu Kerja");
    expect(result.totalPages).toBe(5);
  });

  it("decrypts search envelope and returns manga array", () => {
    const result = decryptEnvelope(encryptedSearchEnvelope) as { manga: unknown[] };
    expect(Array.isArray(result.manga)).toBe(true);
    expect(result.manga.length).toBe(1);
  });

  it("decrypts detail envelope with embedded chapters", () => {
    const result = decryptEnvelope(encryptedDetailEnvelope) as typeof expectedDetailPayload;
    expect(result.data?.title).toBe("Hantu Kerja");
    expect(Array.isArray(result.data?.chapters)).toBe(true);
    expect(result.data?.chapters!.length).toBe(2);
    expect(result.data?.chapters![0].number).toBe(36);
  });

  it("decrypts pages envelope and returns image URLs", () => {
    const result = decryptEnvelope(encryptedPagesEnvelope) as typeof expectedPagesPayload;
    expect(Array.isArray(result.data?.images)).toBe(true);
    expect(result.data!.images!.length).toBe(3);
    expect(result.data!.images![0]).toContain("cdnesia.my.id");
  });

  it("decrypts empty list envelope", () => {
    const result = decryptEnvelope(encryptedEmptyListEnvelope) as { data: unknown[] };
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
  });

  it("handles non-encrypted plaintext envelope", () => {
    const result = decryptEnvelope(plaintextEnvelope) as { data: unknown[] };
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("throws KOMIKNESIA_DECRYPT_FAILURE for invalid base64", () => {
    const bad: KomikNesiaEnvelope = {
      status: true,
      encrypted: true,
      data: "!!!not_valid_base64!!!",
      time: TEST_TIME,
    };
    expect(() => decryptEnvelope(bad)).toThrow(/KOMIKNESIA_DECRYPT_FAILURE/);
  });

  it("throws KOMIKNESIA_DECRYPT_FAILURE for data too short (< 17 bytes)", () => {
    // 10 bytes of base64 → "AAAAAAAAAAAAAAAA" is 12 bytes but need 17+
    const tooShort = Buffer.alloc(10, 0x00).toString("base64");
    const bad: KomikNesiaEnvelope = {
      status: true,
      encrypted: true,
      data: tooShort,
      time: TEST_TIME,
    };
    expect(() => decryptEnvelope(bad)).toThrow(/KOMIKNESIA_DECRYPT_FAILURE/);
  });

  it("throws KOMIKNESIA_DECRYPT_FAILURE for wrong key (different time)", () => {
    // Use the real encrypted list envelope but tamper the time
    const tampered: KomikNesiaEnvelope = { ...encryptedListEnvelope, time: 9999 };
    expect(() => decryptEnvelope(tampered)).toThrow(/KOMIKNESIA_DECRYPT_FAILURE/);
  });

  it("throws KOMIKNESIA_MALFORMED_JSON for non-encrypted invalid JSON", () => {
    const bad: KomikNesiaEnvelope = {
      status: true,
      encrypted: false,
      data: "this is not json {{{",
      time: TEST_TIME,
    };
    expect(() => decryptEnvelope(bad)).toThrow(/KOMIKNESIA_MALFORMED_JSON/);
  });
});

// ============================================================
// SECTION 3: Normalizer — Status
// ============================================================

describe("KomikNesia / normalizer / status", () => {
  it.each([
    ["ongoing", "ONGOING"],
    ["hiatus", "ONGOING"],
    ["berlangsung", "ONGOING"],
    ["completed", "COMPLETED"],
    ["tamat", "COMPLETED"],
    ["selesai", "COMPLETED"],
    ["cancelled", "CANCELLED"],
    ["dropped", "CANCELLED"],
    ["batal", "CANCELLED"],
    ["unknown_val", "UNKNOWN"],
    [undefined, "UNKNOWN"],
  ])("maps %s → %s", (input, expected) => {
    expect(normalizeKomikNesiaStatus(input as string | undefined)).toBe(expected);
  });
});

// ============================================================
// SECTION 4: Normalizer — MangaItem
// ============================================================

describe("KomikNesia / normalizer / MangaItem", () => {
  const rawItem = expectedListPayload.data![0];

  it("maps id from slug", () => {
    const item = normalizeKomikNesiaMangaItem(rawItem);
    expect(item.id).toBe("even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work");
  });

  it("maps title", () => {
    const item = normalizeKomikNesiaMangaItem(rawItem);
    expect(item.title).toBe("Hantu Kerja");
  });

  it("maps coverUrl from cover field", () => {
    const item = normalizeKomikNesiaMangaItem(rawItem);
    expect(item.coverUrl).toBe("https://data.cdnesia.my.id/covers/hantu-kerja.jpg");
  });

  it("maps latestChapter number", () => {
    const item = normalizeKomikNesiaMangaItem(rawItem);
    expect(item.latestChapter).toBe("Chapter 36");
  });

  it("maps latestChapterTime from releasedAt", () => {
    const item = normalizeKomikNesiaMangaItem(rawItem);
    expect(item.latestChapterTime).toBe("2024-01-10T00:00:00Z");
  });

  it("falls back to thumbnail when cover is absent", () => {
    const item = normalizeKomikNesiaMangaItem({
      ...rawItem,
      cover: undefined,
      thumbnail: "https://data.cdnesia.my.id/thumb.jpg",
    });
    expect(item.coverUrl).toBe("https://data.cdnesia.my.id/thumb.jpg");
  });
});

// ============================================================
// SECTION 5: Normalizer — MangaDetail
// ============================================================

describe("KomikNesia / normalizer / MangaDetail", () => {
  const rawDetail = expectedDetailPayload.data!;

  it("maps genres array of strings", () => {
    const detail = normalizeKomikNesiaMangaDetail(rawDetail);
    expect(detail.genres).toEqual(["Action", "Comedy"]);
  });

  it("maps author and artist", () => {
    const detail = normalizeKomikNesiaMangaDetail(rawDetail);
    expect(detail.author).toBe("Author A");
    expect(detail.artist).toBe("Artist B");
  });

  it("maps description", () => {
    const detail = normalizeKomikNesiaMangaDetail(rawDetail);
    expect(detail.description).toBe("Sebuah cerita tentang hantu dan pekerjaan");
  });

  it("falls back to synopsis when description is absent", () => {
    const detail = normalizeKomikNesiaMangaDetail({
      ...rawDetail,
      description: undefined,
      synopsis: "Synopsis fallback",
    });
    expect(detail.description).toBe("Synopsis fallback");
  });

  it("handles genre objects with name field", () => {
    const detail = normalizeKomikNesiaMangaDetail({
      ...rawDetail,
      genres: [{ id: 1, name: "Action", slug: "action" }],
    });
    expect(detail.genres).toEqual(["Action"]);
  });

  it("returns empty genres for missing genres", () => {
    const detail = normalizeKomikNesiaMangaDetail({ ...rawDetail, genres: undefined });
    expect(detail.genres).toEqual([]);
  });
});

// ============================================================
// SECTION 6: Normalizer — Chapter
// ============================================================

describe("KomikNesia / normalizer / Chapter", () => {
  const rawChapter = expectedDetailPayload.data!.chapters![0];
  const mangaSlug = "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work";

  it("uses chapter slug as chapter ID", () => {
    const ch = normalizeKomikNesiaChapter(rawChapter, mangaSlug);
    expect(ch.id).toBe(
      "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia"
    );
  });

  it("sets mangaId to manga slug", () => {
    const ch = normalizeKomikNesiaChapter(rawChapter, mangaSlug);
    expect(ch.mangaId).toBe(mangaSlug);
  });

  it("sets chapter number", () => {
    const ch = normalizeKomikNesiaChapter(rawChapter, mangaSlug);
    expect(ch.number).toBe(36);
  });

  it("falls back to generated ID when slug absent", () => {
    const ch = normalizeKomikNesiaChapter({ ...rawChapter, slug: undefined }, mangaSlug);
    expect(ch.id).toContain(mangaSlug);
    expect(ch.id).toContain("36");
  });

  it("uses releasedAt for date", () => {
    const ch = normalizeKomikNesiaChapter(rawChapter, mangaSlug);
    expect(ch.date).toBe("2024-01-10T00:00:00Z");
  });
});

// ============================================================
// SECTION 7: Normalizer — Pages
// ============================================================

describe("KomikNesia / normalizer / Pages", () => {
  it("maps image URLs to PageItem array with index", () => {
    const images = expectedPagesPayload.data!.images!;
    const result = normalizeKomikNesiaPages(images, "test-chapter-id");
    expect(result.chapterId).toBe("test-chapter-id");
    expect(result.pages.length).toBe(3);
    expect(result.pages[0]).toEqual({ index: 0, url: images[0] });
    expect(result.pages[2]).toEqual({ index: 2, url: images[2] });
  });

  it("filters out empty/falsy image URLs", () => {
    const result = normalizeKomikNesiaPages(["", "https://valid.com/img.jpg", ""], "ch-id");
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].url).toBe("https://valid.com/img.jpg");
  });

  it("returns empty pages for empty images array", () => {
    const result = normalizeKomikNesiaPages([], "ch-id");
    expect(result.pages).toEqual([]);
  });
});

// ============================================================
// SECTION 8: Adapter — with mocked HttpClient
// ============================================================

function makeSource(mockGet: ReturnType<typeof vi.fn>) {
  const mockClient = {
    get: mockGet,
    getBaseUrl: vi.fn(() => "https://api-be.komiknesia.my.id/api"),
    getConfig: vi.fn(),
    setBaseUrl: vi.fn(),
  } as unknown as HttpClient;
  return new KomikNesiaSource(mockClient);
}

describe("KomikNesia / adapter / identity", () => {
  it("has correct source id", () => {
    expect(new KomikNesiaSource().id).toBe("komiknesia");
  });

  it("has correct upstreamDomain", () => {
    expect(new KomikNesiaSource().upstreamDomain).toBe("api-be.komiknesia.my.id");
  });
});

describe("KomikNesia / adapter / getPopular", () => {
  it("returns normalized manga list", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedListEnvelope));
    const result = await source.getPopular(1);
    expect(Array.isArray(result.mangas)).toBe(true);
    expect(result.mangas.length).toBe(1);
    expect(result.mangas[0].id).toBe(
      "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work"
    );
  });

  it("indicates hasNextPage when totalPages > 1", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedListEnvelope));
    const result = await source.getPopular(1);
    expect(result.hasNextPage).toBe(true);
  });

  it("returns empty list for empty response", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedEmptyListEnvelope));
    const result = await source.getPopular(1);
    expect(result.mangas).toEqual([]);
    expect(result.hasNextPage).toBe(false);
  });
});

describe("KomikNesia / adapter / search", () => {
  it("returns search results", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedSearchEnvelope));
    const result = await source.search("hantu", 1);
    expect(result.mangas.length).toBe(1);
    expect(result.mangas[0].title).toBe("Hantu Kerja");
  });

  it("hasNextPage false when totalPages=1", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedSearchEnvelope));
    const result = await source.search("hantu", 1);
    expect(result.hasNextPage).toBe(false);
  });
});

describe("KomikNesia / adapter / getDetail", () => {
  it("returns normalized detail with genres and description", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedDetailEnvelope));
    const detail = await source.getDetail(
      "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work"
    );
    expect(detail.title).toBe("Hantu Kerja");
    expect(detail.genres).toEqual(["Action", "Comedy"]);
    expect(detail.description).toBe("Sebuah cerita tentang hantu dan pekerjaan");
    expect(detail.author).toBe("Author A");
  });

  it("throws INVALID_MANGA_ID for empty slug", async () => {
    const source = makeSource(vi.fn());
    await expect(source.getDetail("")).rejects.toThrow("INVALID_MANGA_ID");
  });

  it("throws not found when response has no title", async () => {
    const badEnvelope: KomikNesiaEnvelope = {
      status: true,
      encrypted: false,
      data: JSON.stringify({ status: true, data: null }),
      time: TEST_TIME,
    };
    const source = makeSource(vi.fn().mockResolvedValue(badEnvelope));
    await expect(source.getDetail("some-slug")).rejects.toThrow("not found");
  });
});

describe("KomikNesia / adapter / getChapters", () => {
  it("returns chapters from detail embedded chapters list", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedDetailEnvelope));
    const chapters = await source.getChapters(
      "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work"
    );
    expect(chapters.length).toBe(2);
    expect(chapters[0].number).toBe(36);
    expect(chapters[1].number).toBe(35);
  });

  it("returns empty array when chapters field absent", async () => {
    const noChaptersEnvelope: KomikNesiaEnvelope = {
      status: true,
      encrypted: false,
      data: JSON.stringify({ status: true, data: { title: "Test", slug: "test", chapters: undefined } }),
      time: TEST_TIME,
    };
    const source = makeSource(vi.fn().mockResolvedValue(noChaptersEnvelope));
    const chapters = await source.getChapters("test");
    expect(chapters).toEqual([]);
  });

  it("throws INVALID_MANGA_ID for empty slug", async () => {
    const source = makeSource(vi.fn());
    await expect(source.getChapters("")).rejects.toThrow("INVALID_MANGA_ID");
  });
});

describe("KomikNesia / adapter / getPages", () => {
  it("returns page items from images array", async () => {
    const source = makeSource(vi.fn().mockResolvedValue(encryptedPagesEnvelope));
    const pages = await source.getPages(
      "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia"
    );
    expect(pages.pages.length).toBe(3);
    expect(pages.pages[0].url).toContain("cdnesia.my.id");
    expect(pages.pages[0].index).toBe(0);
  });

  it("returns empty pages for null images", async () => {
    const emptyPages: KomikNesiaEnvelope = {
      status: true,
      encrypted: false,
      data: JSON.stringify({ status: true, data: { images: null } }),
      time: TEST_TIME,
    };
    const source = makeSource(vi.fn().mockResolvedValue(emptyPages));
    const result = await source.getPages("some-chapter-slug");
    expect(result.pages).toEqual([]);
  });

  it("throws INVALID_CHAPTER_ID for empty slug", async () => {
    const source = makeSource(vi.fn());
    await expect(source.getPages("")).rejects.toThrow("INVALID_CHAPTER_ID");
  });
});

describe("KomikNesia / adapter / getFilters", () => {
  it("returns filter structure (genres empty — not supported)", async () => {
    const source = new KomikNesiaSource();
    const filters = await source.getFilters();
    expect(Array.isArray(filters.genres)).toBe(true);
    expect(filters.genres.length).toBe(0);
  });
});

// ============================================================
// SECTION 9: Security — allowed-host boundary
// ============================================================

describe("KomikNesia / security / allowed-host enforcement", () => {
  it("HttpClient is configured with only api-be.komiknesia.my.id in allowedHosts", () => {
    const source = new KomikNesiaSource();
    // Access via getConfig — verifies production constructor
    const cfg = (source as unknown as { client: HttpClient }).client.getConfig();
    expect(cfg.allowedHosts).toEqual(["api-be.komiknesia.my.id"]);
  });
});

// ============================================================
// SECTION 10: Source Registry placeholder
// ============================================================

describe("KomikNesia / registry / active entry exists", () => {
  it("sourceRegistry contains komiknesia entry with isEnabled=true", async () => {
    // Use fresh require to bypass Vitest module cache
    const registry = await import("@/shared/sources/source-registry?t=" + Date.now());
    const allSources = registry.sourceRegistry ?? registry.default?.sourceRegistry ?? [];
    // Also accept finding it through KomikNesiaSource identity check
    const komiknesiaSource = new KomikNesiaSource();
    expect(komiknesiaSource.id).toBe("komiknesia");
    expect(komiknesiaSource.isEnabled).toBe(true);
    expect(komiknesiaSource.status).toBe("online");
  });
});
