import { describe, expect, it } from "vitest";
import { filterCatalogContent } from "../catalog-content-policy";
import { sourceRegistry } from "@/shared/sources/source-registry";
import type { SearchCatalogCandidate } from "@/shared/lib/search-intelligence";

const candidate = (sourceId: string, extra: Partial<SearchCatalogCandidate> = {}): SearchCatalogCandidate => ({
  canonicalKey: sourceId, sourceId, mangaId: "work", title: "Work", ...extra,
});

describe("shared catalog safety", () => {
  it("does not leak restricted, unknown mixed-source or disabled records through related titles", () => {
    const sources = sourceRegistry.map((source) => source.id === "komikindo" ? { ...source, isEnabled: false } : source);
    const records = [candidate("doujindesu"), candidate("mangadex"), candidate("mangadex", { canonicalKey: "adult", contentRating: "erotica" }),
      candidate("mangadex", { canonicalKey: "safe", contentRating: "safe" }), candidate("komikindo")];
    expect(filterCatalogContent(records, sources).map((record) => record.canonicalKey)).toEqual(["safe"]);
  });
  it("removes ineligible bindings without inventing a replacement identity", () => {
    const record = candidate("mangadex", { contentRating: "safe", sourceBindings: [
      { sourceId: "mangadex", mangaId: "work", title: "Work" },
      { sourceId: "doujindesu", mangaId: "other", title: "Work" },
    ] });
    const [result] = filterCatalogContent([record], sourceRegistry);
    expect(result.sourceId).toBe("mangadex");
    expect(result.sourceBindings?.map((binding) => binding.sourceId)).toEqual(["mangadex"]);
  });
});
