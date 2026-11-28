import { describe, it, expect, vi, afterEach } from "vitest";
import { useSourceHealthStore } from "@/shared/store/source-health-store";
import type { GlobalSearchResponse } from "@/shared/types/search";
import { useSettingsStore } from "@/shared/store/settings-store";
import { apiClient } from "@/shared/api-client";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

describe("F11: Shared API Client Type Boundary", () => {
  it("exports GlobalSearchResponse from shared types without server route dependencies", () => {
    const mockResponse: GlobalSearchResponse = {
      resultsBySource: {
        komikindo: {
          results: [],
          hasNextPage: false,
        },
      },
      canonicalResults: [],
    };

    expect(mockResponse.resultsBySource.komikindo.results).toEqual([]);
    expect(typeof apiClient.searchGlobal).toBe("function");
  });
});

describe("Reader page query scope", () => {
  it("isolates reused chapter IDs and reader preferences", () => {
    const original = useSettingsStore.getState();
    try {
      useSettingsStore.setState({ hideNsfw: true, dataSaver: false, preferredLanguages: ["id"] });
      const key = apiClient.pagesQuery("shinigami", "title-a", "1").queryKey;
      expect(apiClient.pagesQuery("shinigami", "title-b", "1").queryKey).not.toEqual(key);

      useSettingsStore.setState({ dataSaver: true });
      const lite = apiClient.pagesQuery("shinigami", "title-a", "1").queryKey;
      expect(lite).not.toEqual(key);
      useSettingsStore.setState({ hideNsfw: false });
      expect(apiClient.pagesQuery("shinigami", "title-a", "1").queryKey).not.toEqual(lite);
    } finally {
      useSettingsStore.setState(original);
    }
  });
});

describe("Catalog request provider identity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ["getLatest", "latest"],
    ["getPopular", "popular"],
  ] as const)("uses the resolved provider to build the outgoing %s URL", async (method, operation) => {
    const sourceId = "provider";
    const storedManifest = "https://browser.example/manifest.json";
    const resolvedManifest = "https://chosen.example/manifest.json?version=1";
    const getLocalSource = vi.spyOn(dynamicSourceRegistry, "get");
    const originalStorage = localStorage.getItem("yomirra_dynamic_sources");
    localStorage.setItem("yomirra_dynamic_sources", JSON.stringify({
      [sourceId]: { id: sourceId, name: "Browser Provider", manifestUrl: storedManifest, capabilities: [] },
    }));
    const fetchCatalog = vi.fn<(url: string) => Promise<Response>>().mockImplementation(async () =>
      Response.json({ data: { mangas: [], hasNextPage: false } }));
    vi.stubGlobal("fetch", fetchCatalog);

    try {
      await apiClient[method](sourceId, 2, { manifestUrl: null });
      await apiClient[method](sourceId, 2, { manifestUrl: resolvedManifest });
      expect(getLocalSource).not.toHaveBeenCalled();
      await apiClient[method](sourceId, 2);

      const urls = fetchCatalog.mock.calls.map(([url]) => new URL(url, "https://yomirra.example"));
      expect(urls).toHaveLength(3);
      for (const url of urls) {
        expect(url.pathname).toBe(`/api/sources/${sourceId}/${operation}`);
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.has("hideNsfw")).toBe(true);
      }
      expect(urls.map((url) => url.searchParams.get("manifestUrl")))
        .toEqual([null, resolvedManifest, storedManifest]);
    } finally {
      if (originalStorage === null) localStorage.removeItem("yomirra_dynamic_sources");
      else localStorage.setItem("yomirra_dynamic_sources", originalStorage);
    }
  });
});

describe("Source health must not reflect device connectivity failures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ignores client network transport failures instead of marking the source down", async () => {
    const recordError = vi.spyOn(useSourceHealthStore.getState(), "recordError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(apiClient.pagesQuery("shinigami", "example", "1").queryFn()).rejects.toThrow("Failed to fetch");

    expect(recordError).not.toHaveBeenCalled();
  });

  it("does not report client-side rate limits as upstream outages", async () => {
    const recordError = vi.spyOn(useSourceHealthStore.getState(), "recordError");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: "RATE_LIMITED", message: "Too many requests" } }),
    }));

    await expect(apiClient.pagesQuery("shinigami", "example", "1").queryFn()).rejects.toMatchObject({ status: 429 });

    expect(recordError).not.toHaveBeenCalled();
  });
});
