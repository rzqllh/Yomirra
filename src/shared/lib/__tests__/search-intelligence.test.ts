import { describe, expect, it } from "vitest";
import {
  parseSearchExpression,
  resolveSearchTag,
  rankHybridScore,
  suggestSearchTags,
} from "../search-intelligence";
import { mergeFilters, buildPayloadForSource } from "@/shared/utils/filter-helpers";

describe("search intelligence", () => {
  it("parses Indonesian aliases into hard filters", () => {
    const parsed = parseSearchExpression("solo leveling #fantasi #tamat");

    expect(parsed.textQuery).toBe("solo leveling");
    expect(parsed.tags.map((tag) => [tag.category, tag.id])).toEqual([
      ["genre", "fantasy"],
      ["status", "completed"],
    ]);
  });

  it("resolves a clear tag typo but leaves short ambiguous fragments unresolved", () => {
    expect(resolveSearchTag("#fantassy")?.id).toBe("fantasy");
    expect(resolveSearchTag("#rom")).toBeNull();
    expect(suggestSearchTags("rom")[0]?.id).toBe("romance");
  });

  it("maps canonical filters back to each source value", () => {
    const merged = mergeFilters([
      {
        sourceId: "source-a",
        filters: {
          genres: [{ id: "fantasy", name: "Fantasy" }],
          formats: [],
          statuses: [{ id: "completed", name: "Completed" }],
          sorts: [],
        },
      },
      {
        sourceId: "source-b",
        filters: {
          genres: [{ id: "fantasi", name: "Fantasi" }],
          formats: [],
          statuses: [{ id: "tamat", name: "Tamat" }],
          sorts: [],
        },
      },
    ]);

    expect(merged.genres).toHaveLength(1);
    expect(merged.genres[0].id).toBe("fantasy");
    expect(merged.genres[0].supportedBy).toEqual(["source-a", "source-b"]);

    expect(
      buildPayloadForSource("source-b", merged, {
        genres: ["fantasy"],
        formats: [],
        status: "completed",
        sort: "",
      })
    ).toEqual({
      "genre[]": ["fantasi"],
      status: "tamat",
    });
  });

  it("keeps exact title matches ahead of semantic-only matches", () => {
    const exact = rankHybridScore(
      "Solo Leveling",
      {
        canonicalKey: "canonical:solo-leveling",
        sourceId: "a",
        mangaId: "1",
        title: "Solo Leveling",
      },
      0.2
    );

    const semanticOnly = rankHybridScore(
      "Solo Leveling",
      {
        canonicalKey: "canonical:other",
        sourceId: "a",
        mangaId: "2",
        title: "Unrelated Story",
      },
      1
    );

    expect(exact).toBeGreaterThan(semanticOnly);
  });
});
