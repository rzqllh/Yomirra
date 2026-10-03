import { describe, expect, it } from "vitest";
import { aggregatePopularFeeds, type PopularSourceFeed } from "../popular-ranking";

function feed(
  sourceId: string,
  titles: Array<{ id: string; title: string; author?: string; alternativeTitles?: string[] }>
): PopularSourceFeed {
  return {
    sourceId,
    sourceName: sourceId.toUpperCase(),
    mangas: titles.map((item) => ({
      ...item,
      coverUrl: `/${item.id}.jpg`,
    })),
  };
}

describe("popular rank aggregation", () => {
  it("deduplicates exact normalized canonical titles across sources", () => {
    const result = aggregatePopularFeeds([
      feed("a", [{ id: "a1", title: "Solo Leveling" }]),
      feed("b", [{ id: "b1", title: "Solo Leveling!" }]),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].contributingSources).toBe(2);
    expect(result[0].sourceBindings).toHaveLength(2);
  });

  it("can match an exact alternate title without fuzzy merging", () => {
    const result = aggregatePopularFeeds([
      feed("a", [
        {
          id: "a1",
          title: "Solo Leveling",
          alternativeTitles: ["Only I Level Up"],
        },
      ]),
      feed("b", [{ id: "b1", title: "Only I Level Up" }]),
      feed("c", [{ id: "c1", title: "Solo Leveling: Side Story" }]),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].contributingSources).toBe(2);
  });

  it("keeps same-looking titles separate when known authors conflict", () => {
    const result = aggregatePopularFeeds([
      feed("a", [{ id: "a1", title: "Restart", author: "Author A" }]),
      feed("b", [{ id: "b1", title: "Restart", author: "Author B" }]),
    ]);

    expect(result).toHaveLength(2);
  });

  it("uses rank contributions instead of provider-specific raw metrics", () => {
    const result = aggregatePopularFeeds([
      feed("a", [
        { id: "a1", title: "Shared" },
        { id: "a2", title: "Only A" },
      ]),
      feed("b", [
        { id: "b1", title: "Other B" },
        { id: "b2", title: "Shared" },
      ]),
    ]);

    expect(result[0].manga.title).toBe("Shared");
    expect(result[0].contributingSources).toBe(2);
  });

  it("does not mutate per-source native order", () => {
    const source = feed("a", [
      { id: "1", title: "First" },
      { id: "2", title: "Second" },
    ]);
    const before = source.mangas.map((manga) => manga.id);

    aggregatePopularFeeds([source]);

    expect(source.mangas.map((manga) => manga.id)).toEqual(before);
  });
});
