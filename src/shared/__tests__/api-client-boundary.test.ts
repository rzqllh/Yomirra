import { describe, it, expect } from "vitest";
import type { GlobalSearchResponse } from "@/shared/types/search";
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
