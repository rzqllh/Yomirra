import { describe, expect, it } from "vitest";
import { canonicalSourceKey, groupVerifiedCatalogEntries, indexVerifiedGroups, canonicalGroupPreferenceKey, canonicalGroupPreferenceAliases } from "../canonical-identity";

const entry = (sourceId: string, mangaId: string, extra: Record<string, unknown> = {}) =>
  ({ sourceId, mangaId, id: `${sourceId}:${mangaId}`, ...extra });

describe("verified canonical grouping (non-destructive)", () => {
  it("does not merge identical titles without explicit identity evidence", () => {
    const input = [entry("a", "work-one", { title: "The Hero" }), entry("b", "work-two", { title: "The Hero" })];
    const result = groupVerifiedCatalogEntries(input);
    expect(result).toHaveLength(2);
    expect(input).toHaveLength(2);
  });

  it("ignores heuristic links and only merges explicitly confirmed bindings", () => {
    const a = entry("a", "a1", { linkedSources: [{ sourceId: "b", mangaId: "b1", matchConfidence: "HIGH_CONFIDENCE" }] });
    const b = entry("b", "b1");
    expect(groupVerifiedCatalogEntries([a, b])).toHaveLength(2);
    const verified = { ...a, linkedSources: [{ sourceId: "b", mangaId: "b1", matchConfidence: "CONFIRMED" }] };
    const groups = groupVerifiedCatalogEntries([verified, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0].sourceBindings).toHaveLength(2);
    expect(groups[0].members).toHaveLength(2);
  });

  it("supports reversible splits by removing confirmation without touching original rows", () => {
    const first = entry("a", "1", { linkedSources: [{ sourceId: "b", mangaId: "2", matchConfidence: "CONFIRMED" }] });
    const second = entry("b", "2");
    expect(groupVerifiedCatalogEntries([first, second])).toHaveLength(1);
    const split = { ...first, linkedSources: [] };
    expect(groupVerifiedCatalogEntries([split, second])).toHaveLength(2);
    expect(first).toEqual(expect.objectContaining({ linkedSources: expect.any(Array) }));
  });

  it("groups exact source identity duplicates, never title-only collisions", () => {
    const groups = groupVerifiedCatalogEntries([entry("x", "same"), entry("x", "same"), entry("x", "different")]);
    expect(groups).toHaveLength(2);
    expect(groups[0].members).toHaveLength(2);
  });

  it("handles delimiters unambiguously and preserves source IDs", () => {
    expect(canonicalSourceKey("a::b", "c")).not.toBe(canonicalSourceKey("a", "b::c"));
    const groups = groupVerifiedCatalogEntries([entry("a::b", "c"), entry("a", "b::c")]);
    expect(indexVerifiedGroups(groups).size).toBe(2);
  });

  it("never mutates input records or their link arrays", () => {
    const links = Object.freeze([{ sourceId: "x", mangaId: "2", matchConfidence: "CONFIRMED" as const }]);
    const saved = Object.freeze({ ...entry("x", "1"), linkedSources: links });
    expect(() => groupVerifiedCatalogEntries([saved])).not.toThrow();
    expect(saved.linkedSources).toBe(links);
  });
  it("resolves the same preferred-source key across reordered saved records and old aliases", () => {
    const groupA = groupVerifiedCatalogEntries([
      entry("shinigami", "work-a", {
        id: "z-local",
        linkedSources: [{ sourceId: "asurascans", mangaId: "work-b", matchConfidence: "CONFIRMED" }],
      }),
      entry("asurascans", "work-b", { id: "a-cloud" }),
    ])[0];
    const groupB = groupVerifiedCatalogEntries([...groupA.members].reverse())[0];
    expect(canonicalGroupPreferenceKey(groupA)).toBe("a-cloud");
    expect(canonicalGroupPreferenceKey(groupB)).toBe("a-cloud");
    expect(canonicalGroupPreferenceAliases(groupA)).toEqual(expect.arrayContaining([
      "a-cloud", "z-local", "shinigami::work-a", "asurascans::work-b",
    ]));
  });

});
