import { describe, it, expect, beforeEach, vi } from "vitest";
import { probeSourceHealth } from "../probe";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { domainResolver } from "../../domain-resolver";
import { sourceHealthStore } from "../health-store";
import { SourceError } from "../../error";

vi.mock("@/server/lib/cache/redis", () => ({
  redis: null,
}));

describe("Functional Health Probe (probeSourceHealth)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await domainResolver.resetDomainCache();
    await sourceHealthStore.clear();
  });

  it("evaluates a healthy API source successfully (lightweight probe)", async () => {
    const mockAdapter: any = {
      id: "komiku-ii",
      baseUrl: "https://01.komiku.asia",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [{ id: "one-piece", title: "One Piece", coverUrl: "https://img.com/op.jpg" }],
        hasNextPage: true,
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komiku-ii");

    expect(snapshot.status).toBe("HEALTHY");
    expect(snapshot.stage).toBe("search");
    expect(snapshot.consecutiveFailures).toBe(0);
    expect(snapshot.metadata?.totalParsed).toBe(1);
    expect(mockAdapter.getPopular).toHaveBeenCalledWith(1);
  });

  it("evaluates a healthy HTML parser source successfully", async () => {
    const mockAdapter: any = {
      id: "komikindo",
      baseUrl: "https://komikindo.ch",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [
          { id: "naruto", title: "Naruto", coverUrl: "https://img.com/naruto.jpg" },
          { id: "bleach", title: "Bleach", coverUrl: "https://img.com/bleach.jpg" },
        ],
        hasNextPage: true,
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komikindo");

    expect(snapshot.status).toBe("HEALTHY");
    expect(snapshot.stage).toBe("search");
    expect(snapshot.metadata?.totalParsed).toBe(2);
  });

  it("detects timeout as UPSTREAM_TIMEOUT", async () => {
    const mockAdapter: any = {
      id: "komiku",
      getPopular: vi.fn().mockRejectedValue(new Error("Request timed out after 10000ms")),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komiku");

    expect(snapshot.status).toBe("BROKEN");
    expect(snapshot.lastFailureCode).toBe("UPSTREAM_TIMEOUT");
    expect(snapshot.stage).toBe("search");
  });

  it("detects 403 or Cloudflare challenge as UPSTREAM_BLOCKED", async () => {
    const mockAdapter: any = {
      id: "shinigami",
      getPopular: vi.fn().mockRejectedValue({
        statusCode: 403,
        message: "Access Denied: Cloudflare Turnstile required",
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("shinigami");

    expect(snapshot.status).toBe("BROKEN");
    expect(snapshot.lastFailureCode).toBe("UPSTREAM_BLOCKED");
  });

  it("detects HTTP 429 as RATE_LIMITED", async () => {
    const mockAdapter: any = {
      id: "mangadex",
      getPopular: vi.fn().mockRejectedValue({
        statusCode: 429,
        message: "Rate limit exceeded. Retry after 5s",
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("mangadex");

    expect(snapshot.status).toBe("RATE_LIMITED");
    expect(snapshot.lastFailureCode).toBe("RATE_LIMITED");
  });

  it("detects HTTP 200 + empty parse result as PARSER_BROKEN", async () => {
    // When upstream returns 200 OK but HTML structure changed, getPopular parses 0 items
    const mockAdapter: any = {
      id: "komikindo",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [], // 0 items on popular page 1 is abnormal
        hasNextPage: false,
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komikindo");

    expect(snapshot.status).toBe("BROKEN");
    expect(snapshot.lastFailureCode).toBe("PARSER_BROKEN");
    expect(snapshot.stage).toBe("search");
  });

  it("detects Komikindo ROUTE_CHANGED incident (404 on listing/search)", async () => {
    const mockAdapter: any = {
      id: "komikindo",
      getPopular: vi.fn().mockRejectedValue({
        statusCode: 404,
        message: "Not Found: GET /manga/page/1/",
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komikindo");

    expect(snapshot.status).toBe("BROKEN");
    expect(snapshot.lastFailureCode).toBe("ROUTE_CHANGED");
    expect(snapshot.stage).toBe("search");
  });

  it("detects KomikNesia decrypt failure as DECRYPT_FAILURE", async () => {
    const mockAdapter: any = {
      id: "komiknesia",
      getPopular: vi.fn().mockRejectedValue(new Error("AES-256 decrypt failed: bad decrypt padding")),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komiknesia");

    expect(snapshot.status).toBe("BROKEN");
    expect(snapshot.lastFailureCode).toBe("DECRYPT_FAILURE");
  });

  it("executes deep probe through detail, chapters, and pages layers without downloading full images", async () => {
    const mockAdapter: any = {
      id: "asurascans",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [{ id: "solo-leveling", title: "Solo Leveling", coverUrl: "https://cdn.com/sl.jpg" }],
        hasNextPage: true,
      }),
      getDetail: vi.fn().mockResolvedValue({
        id: "solo-leveling",
        title: "Solo Leveling",
        description: "Hunter Jinwoo",
        genres: ["Action"],
        status: "COMPLETED",
      }),
      getChapters: vi.fn().mockResolvedValue([
        { id: "ch-1", mangaId: "solo-leveling", number: 1, title: "Chapter 1", isLocked: false },
      ]),
      getPages: vi.fn().mockResolvedValue({
        chapterId: "ch-1",
        pages: [
          { index: 0, url: "https://cdn.asurascans.com/asura-images/page1.webp" },
          { index: 1, url: "https://cdn.asurascans.com/asura-images/page2.webp" },
        ],
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("asurascans", { deep: true });

    expect(snapshot.status).toBe("HEALTHY");
    expect(snapshot.stage).toBe("pages");
    expect(snapshot.metadata?.probeType).toBe("deep");
    expect(mockAdapter.getDetail).toHaveBeenCalledWith("solo-leveling");
    expect(mockAdapter.getChapters).toHaveBeenCalledWith("solo-leveling");
    expect(mockAdapter.getPages).toHaveBeenCalledWith("ch-1");
  });

  it("switches to fallback mirror on transport domain failure", async () => {
    const mockAdapter: any = {
      id: "komikindo",
      getPopular: vi.fn().mockRejectedValue(new Error("fetch failed: ENOTFOUND komikindo.ch")),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    await probeSourceHealth("komikindo");

    // Check that domainResolver marked komikindo.ch as failed and recorded fallback mirror komikindo.cv
    const cached = await domainResolver.getCachedDomain("komikindo", "frontend");
    expect(cached?.currentHost).toBe("https://komikindo.cv");
  });
});
