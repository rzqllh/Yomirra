import { describe, it, expect } from "vitest";
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
