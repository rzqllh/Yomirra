import { describe, it, expect, vi, afterEach } from "vitest";
import { useSourceHealthStore } from "@/shared/store/source-health-store";
import type { GlobalSearchResponse } from "@/shared/types/search";
import { useSettingsStore } from "@/shared/store/settings-store";
import { apiClient } from "@/shared/api-client";

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
