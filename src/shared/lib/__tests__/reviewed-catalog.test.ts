import { describe, expect, it } from "vitest";
import { buildReviewedCatalogIndex, indexDiscoveryCatalog, getReviewedCatalogWork, getReviewedWorkHref } from "../reviewed-catalog";
import { canonicalSourceKey, groupVerifiedCatalogEntries } from "../canonical-identity";
import { clusterCanonicalResults } from "../canonical-search";

const ref = (sourceId: string, mangaId: string) => ({ sourceId, mangaId, evidence: "synthetic test fixture" });
const works = [
  { workId: "first", bindings: [ref("a", "1"), ref("b", "2")] },
  { workId: "second", bindings: [ref("c", "3"), ref("d", "4")] },
];

describe("independent reviewed catalog", () => {
  it("groups unsaved works with distinct titles by reviewed source IDs", () => {
    const index = buildReviewedCatalogIndex(works);
    const results = clusterCanonicalResults([
      { sourceId: "a", manga: { id: "1", title: "Original", coverUrl: "/a" } },
      { sourceId: "b", manga: { id: "2", title: "Translation", coverUrl: "/b" } },
      { sourceId: "c", manga: { id: "3", title: "Original", coverUrl: "/c" } },
    ], { mergePolicy: "verified-only", verifiedIndex: index });
    expect(results).toHaveLength(2);
    expect(results[0].sourceBindings.map(binding => binding.mangaId)).toEqual(["1", "2"]);
    expect(indexDiscoveryCatalog([], index)).toEqual(index);
  });

  it("exposes a stable reviewed work route without a saved record",()=>{
    const index=buildReviewedCatalogIndex(works);
    expect(getReviewedCatalogWork("first",works)).toBe(works[0]);
    expect(getReviewedWorkHref("a","1",index)).toBe("/catalog/work/first");
    expect(getReviewedWorkHref("b","2",index)).toBe("/catalog/work/first");
    expect(getReviewedWorkHref("unknown","1",index)).toBeUndefined();
    expect(getReviewedCatalogWork("unknown",works)).toBeUndefined();
  });
  it("rejects a duplicate provider, missing evidence or conflicting work assignment", () => {
    expect(() => buildReviewedCatalogIndex([{ workId: "x", bindings: [ref("a", "1"), ref("a", "2")] }])).toThrow();
    expect(() => buildReviewedCatalogIndex([{ workId: "x", bindings: [ref("a", "1"), { ...ref("b", "2"), evidence: "" }] }])).toThrow();
    expect(() => buildReviewedCatalogIndex([...works, { workId: "third", bindings: [ref("a", "1"), ref("e", "5")] }])).toThrow();
  });

  it("cannot bridge two reviewed works using a private confirmed link", () => {
    const index = buildReviewedCatalogIndex(works);
    const groups = groupVerifiedCatalogEntries([{ sourceId: "a", mangaId: "1", linkedSources: [
      { sourceId: "c", mangaId: "3", matchConfidence: "CONFIRMED" },
      { sourceId: "e", mangaId: "5", matchConfidence: "CONFIRMED" },
    ] }]);
    const merged = indexDiscoveryCatalog(groups, index);
    expect(merged.get(canonicalSourceKey("a", "1"))).not.toBe(merged.get(canonicalSourceKey("c", "3")));
    expect(merged.has(canonicalSourceKey("e", "5"))).toBe(false);
  });
});
