import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock semantic-catalog
vi.mock("../semantic-catalog", () => ({
  getRecentSearchCatalogRecords: vi.fn().mockResolvedValue([
    {
      canonicalKey: "manga-1",
      title: "Solo Leveling",
      embedding: [0.1, 0.2, 0.3],
    },
    {
      canonicalKey: "manga-2",
      title: "One Piece",
      embedding: null,
    },
  ]),
  upsertSearchCatalogRecords: vi.fn().mockResolvedValue(true),
}));

vi.mock("../gemini-embeddings", () => ({
  isSemanticEmbeddingConfigured: vi.fn().mockReturnValue(true),
}));

describe("Admin Search Intelligence Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return catalog statistics and embedding coverage", async () => {
    const { getSearchIntelligenceStats } = await import("../admin-search-service");
    const stats = await getSearchIntelligenceStats();

    expect(stats.totalCatalogRecords).toBe(2);
    expect(stats.embeddedRecordsCount).toBe(1);
    expect(stats.embeddingCoveragePercent).toBe(50);
    expect(stats.isGeminiConfigured).toBe(true);
  });

  it("should simulate query ranking with weight breakdowns", async () => {
    const { simulateSearchRanking } = await import("../admin-search-service");
    const result = await simulateSearchRanking("solo leveling");

    expect(result.query).toBe("solo leveling");
    expect(Array.isArray(result.rankedResults)).toBe(true);
  });
});
