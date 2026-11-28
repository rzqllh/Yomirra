import { describe, it, expect, beforeEach, vi } from "vitest";
import { probeSourceHealth } from "../probe";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { domainResolver } from "../../domain-resolver";
import { sourceHealthStore } from "../health-store";
import { SourceError } from "../../error";

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: false,
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

  it("uses the lightweight adapter health sample when available", async () => {
    const getHealthSample = vi.fn().mockResolvedValue({
      mangas: [{ id: "sample", title: "Sample", coverUrl: "https://example.com/1.jpg" }],
      hasNextPage: false,
    });
    const getPopular = vi.fn();
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({
      id: "shinigami", getHealthSample, getPopular,
    } as any);
    const result = await probeSourceHealth("shinigami");
    expect(result.status).toBe("HEALTHY");
    expect(getHealthSample).toHaveBeenCalledOnce();
    expect(getPopular).not.toHaveBeenCalled();
  });

  it("requires three failed probes before declaring DOWN and recovers on success", async () => {
    const getPopular = vi.fn()
      .mockRejectedValueOnce(new Error("HTTP 502 Bad Gateway"))
      .mockRejectedValueOnce(new Error("HTTP 502 Bad Gateway"))
      .mockRejectedValueOnce(new Error("HTTP 502 Bad Gateway"))
      .mockResolvedValue({ mangas: [{ id: "sample", title: "Sample" }], hasNextPage: false });
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({ id: "shinigami", getPopular } as any);
    const statuses = [];
    for (let n = 0; n < 4; n++) statuses.push((await probeSourceHealth("shinigami")).status);
    expect(statuses).toEqual(["DEGRADED", "DEGRADED", "BROKEN", "HEALTHY"]);
    expect((await sourceHealthStore.getSnapshot("shinigami"))?.consecutiveFailures).toBe(0);
  });

  it("detects timeout as UPSTREAM_TIMEOUT", async () => {
    const mockAdapter: any = {
      id: "komiku",
      getPopular: vi.fn().mockRejectedValue(new Error("Request timed out after 10000ms")),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("komiku");

    expect(snapshot.status).toBe("DEGRADED");
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

    expect(snapshot.status).toBe("DEGRADED");
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

    expect(snapshot.status).toBe("DEGRADED");
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

    expect(snapshot.status).toBe("DEGRADED");
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

    expect(snapshot.status).toBe("DEGRADED");
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
    expect(mockAdapter.getPages).toHaveBeenCalledWith("ch-1", { mangaId: "solo-leveling" });
  });

  it("rejects non-HTTPS page references in deep probes and preserves lastSuccessAt on subsequent failure", async () => {
    const getPopular = vi.fn()
      .mockResolvedValueOnce({ mangas: [{ id: "work-1", title: "Work 1" }], hasNextPage: false })
      .mockResolvedValueOnce({ mangas: [{ id: "work-1", title: "Work 1" }], hasNextPage: false });
    const getDetail = vi.fn().mockResolvedValue({ id: "work-1", title: "Work 1" });
    const getChapters = vi.fn().mockResolvedValue([
      { id: "ch-1", mangaId: "work-1", number: 1, title: "Chapter 1", isLocked: false },
    ]);
    const getPages = vi.fn().mockResolvedValue({
      chapterId: "ch-1",
      pages: [{ index: 0, url: "http://insecure.example/page1.jpg" }],
    });

    vi.spyOn(sourceManager, "getSource").mockResolvedValue({
      id: "asurascans",
      getPopular,
      getDetail,
      getChapters,
      getPages,
    } as any);

    const healthy = await probeSourceHealth("asurascans", { deep: false });
    expect(healthy.status).toBe("HEALTHY");
    expect(healthy.lastSuccessAt).toBeTruthy();

    const failedDeep = await probeSourceHealth("asurascans", { deep: true });
    expect(failedDeep.status).toBe("DEGRADED");
    expect(failedDeep.stage).toBe("pages");
    expect(failedDeep.lastFailureCode).toBe("SCHEMA_CHANGED");
    expect(failedDeep.lastSuccessAt).toBe(healthy.lastSuccessAt);
  });

  it("does not request locked chapter pages or mark a valid empty chapter list broken", async () => {
    const getPages = vi.fn();
    const getChapters = vi.fn().mockResolvedValueOnce([{ id: "locked", isLocked: true }]).mockResolvedValueOnce([]);
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({
      id: "asurascans", getPopular: vi.fn().mockResolvedValue({ mangas: [{id:"sample",title:"Sample"}] }),
      getDetail: vi.fn().mockResolvedValue({id:"sample",title:"Sample"}), getChapters, getPages,
    } as any);
    const locked = await probeSourceHealth("asurascans", { deep: true });
    expect(locked.stage).toBe("chapters");
    expect(locked.metadata?.pagesSkipped).toBe("locked");
    expect((await probeSourceHealth("asurascans", { deep: true })).metadata?.pagesSkipped).toBe("no-chapters");
    expect(getPages).not.toHaveBeenCalled();
  });

  it("does not inspect unknown-access chapters or foreign parents", async () => {
    const getPages = vi.fn();
    const getChapters = vi.fn()
      .mockResolvedValueOnce([{ id: "unknown", mangaId: "sample" }])
      .mockResolvedValueOnce([{ id: "foreign", mangaId: "other", isLocked: false }]);
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({
      id: "asurascans", getPopular: vi.fn().mockResolvedValue({ mangas: [{ id: "sample", title: "Sample" }] }),
      getDetail: vi.fn().mockResolvedValue({ id: "sample", title: "Sample" }), getChapters, getPages,
    } as any);
    expect((await probeSourceHealth("asurascans", { deep: true })).metadata?.pagesSkipped).toBe("access-unknown");
    expect((await probeSourceHealth("asurascans", { deep: true })).lastFailureCode).toBe("SCHEMA_CHANGED");
    expect(getPages).not.toHaveBeenCalled();
  });

  it("does not turn rate limits into an outage streak", async () => {
    const getPopular = vi.fn().mockRejectedValueOnce({statusCode:429}).mockRejectedValueOnce({statusCode:429}).mockRejectedValueOnce(new Error("HTTP 502"));
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({id:"shinigami", getPopular} as any);
    expect((await probeSourceHealth("shinigami")).consecutiveFailures).toBe(0);
    expect((await probeSourceHealth("shinigami")).status).toBe("RATE_LIMITED");
    expect((await probeSourceHealth("shinigami")).status).toBe("DEGRADED");
  });

  it("does not persist late results after the batch watchdog expires", async () => {
    const controller = new AbortController();
    const getPopular = vi.fn().mockImplementation(async () => {
      controller.abort(new Error("Probe deadline"));
      return {mangas:[{id:"sample", title:"Sample"}]};
    });
    vi.spyOn(sourceManager, "getSource").mockResolvedValue({id:"shinigami", getPopular} as any);
    await expect(probeSourceHealth("shinigami", { signal: controller.signal })).rejects.toThrow("Probe deadline");
    expect(await sourceHealthStore.getSnapshot("shinigami")).toBeNull();
  });

  it("does not mutate domain routing from an isolated transport probe failure", async () => {
    const mockAdapter: any = {
      id: "komikindo",
      getPopular: vi.fn().mockRejectedValue(new Error("fetch failed: ENOTFOUND komikindo.ch")),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    await probeSourceHealth("komikindo");

    const cached = await domainResolver.getCachedDomain("komikindo", "frontend");
    expect(cached).toBeNull();
  });

  it("passes allowDisabled: true to sourceManager so disabled sources can be diagnostically probed", async () => {
    const mockAdapter: any = {
      id: "disabled-source",
      baseUrl: "https://disabled.example",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [{ id: "test", title: "Test", coverUrl: "https://example.com/cover.jpg" }],
        hasNextPage: false,
      }),
    };
    const getSourceSpy = vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const snapshot = await probeSourceHealth("disabled-source");
    expect(snapshot.status).toBe("HEALTHY");
    expect(getSourceSpy).toHaveBeenCalledWith("disabled-source", null, { allowDisabled: true });
  });

  it("probes only runtime-enabled sources in probeAllSourcesHealth", async () => {
    const { probeAllSourcesHealth } = await import("../probe");
    const runtimeSourcesModule = await import("../../runtime-sources");

    vi.spyOn(runtimeSourcesModule, "getRuntimeSources").mockResolvedValue([
      {
        id: "source-a",
        name: "Source A",
        isEnabled: true,
        isInstalled: true,
        status: "online",
        baseUrl: "https://a.example",
        version: "1.0.0",
        isNsfw: false,
        capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: false },
        isDynamic: false,
      },
      {
        id: "source-b",
        name: "Source B",
        isEnabled: false,
        isInstalled: true,
        status: "online",
        baseUrl: "https://b.example",
        version: "1.0.0",
        isNsfw: false,
        capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: false },
        isDynamic: false,
      },
    ]);

    const mockAdapter: any = {
      id: "source-a",
      baseUrl: "https://a.example",
      getPopular: vi.fn().mockResolvedValue({
        mangas: [{ id: "test", title: "Test", coverUrl: "https://example.com/cover.jpg" }],
        hasNextPage: false,
      }),
    };
    vi.spyOn(sourceManager, "getSource").mockResolvedValue(mockAdapter);

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    try {
      const results = await probeAllSourcesHealth();
      expect(results["source-a"]).toBeDefined();
      expect(results["source-b"]).toBeUndefined();

      // A resolved probe must cancel its 10-second watchdog rather than
      // keep an unnecessary pending timer alive in the Function.
      const watchdogs = setTimeoutSpy.mock.calls.flatMap((args, index) =>
        args[1] === 10_000 ? [setTimeoutSpy.mock.results[index]?.value] : []
      );
      expect(watchdogs).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(watchdogs[0]);
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });
});
