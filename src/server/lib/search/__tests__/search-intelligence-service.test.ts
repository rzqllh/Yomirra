import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  getRecent: vi.fn(),
  getRecord: vi.fn(),
  embed: vi.fn(),
}));

vi.mock("../semantic-catalog", () => ({
  getRecentSearchCatalogRecords: mocks.getRecent,
  getSearchCatalogRecord: mocks.getRecord,
  hashEmbeddingText: (text: string) => `hash:${text}`,
  upsertSearchCatalogRecords: mocks.upsert,
}));

vi.mock("../gemini-embeddings", () => ({
  cosineSimilarity: () => 0.8,
  embedSearchText: mocks.embed,
  isSemanticEmbeddingConfigured: () => true,
}));

import {
  findRelatedSearchTitles,
  rankSearchIntelligence,
} from "../search-intelligence-service";

describe("search intelligence trust boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecent.mockResolvedValue([]);
    mocks.getRecord.mockResolvedValue(null);
    mocks.embed.mockResolvedValue([1, 0]);
  });

  it("does not persist client-supplied ranking candidates", async () => {
    await rankSearchIntelligence({
      query: "dark fantasy story with revenge",
      tags: [],
      candidates: [
        {
          canonicalKey: "canonical:test",
          sourceId: "shinigami",
          mangaId: "test-id",
          title: "Test Title",
        },
      ],
    });

    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not persist a client-supplied related-title target", async () => {
    await findRelatedSearchTitles(
      {
        canonicalKey: "canonical:target",
        sourceId: "shinigami",
        mangaId: "target-id",
        title: "Target Title",
      },
      8
    );

    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("finds related titles using metadata baseline when embeddings are absent", async () => {
    mocks.getRecent.mockResolvedValue([
      {
        canonicalKey: "canonical:target",
        sourceId: "shinigami",
        mangaId: "target-id",
        title: "Solo Leveling",
        author: "Chugong",
        format: "Manhwa",
        genres: ["Action", "Fantasy"],
      },
      {
        canonicalKey: "canonical:ragnarok",
        sourceId: "shinigami",
        mangaId: "rag-id",
        title: "Solo Leveling: Ragnarok",
        author: "Daul",
        format: "Manhwa",
        genres: ["Action", "Fantasy"],
      },
      {
        canonicalKey: "canonical:overpowered-sword",
        sourceId: "shinigami",
        mangaId: "sword-id",
        title: "The Overpowered Sword",
        author: "Different Author",
        format: "Manga",
        genres: ["Slice of Life"],
      },
    ]);

    const results = await findRelatedSearchTitles(
      {
        canonicalKey: "canonical:target",
        sourceId: "shinigami",
        mangaId: "target-id",
        title: "Solo Leveling",
        author: "Chugong",
        format: "Manhwa",
        genres: ["Action", "Fantasy"],
      },
      5
    );

    // Ragnarok shares title similarity, format (Manhwa), and genres (Action, Fantasy)
    expect(results).toHaveLength(1);
    expect(results[0].canonicalKey).toBe("canonical:ragnarok");
  });
});
