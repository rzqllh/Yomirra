import { describe, expect, it } from "vitest";
import { selectHeroCandidates, selectSpotlightItems, type HomeFeedManga } from "../home-feed-selection";
import { canonicalSourceKey } from "@/shared/lib/canonical-identity";

const first = { id: "first", sourceId: "source-a", sourceName: "A",
  title: "Same title", author: "Same author", coverUrl: "/cover-a.jpg" } as HomeFeedManga;
const second = { id: "second", sourceId: "source-b", sourceName: "B",
  title: "Same title", author: "Same author", coverUrl: "/cover-b.jpg" } as HomeFeedManga;

describe("verified-only Home discovery projection", () => {
  it("does not hide same-title and same-author works without confirmed identity", () => {
    const empty = new Map<string, string>();
    expect(selectSpotlightItems([first, second], 5, empty)).toEqual([first, second]);
    expect(selectHeroCandidates([first, second], [], 5, empty)).toEqual([first, second]);
  });
  it("deduplicates confirmed bindings in Spotlight and Hero without mutating inputs", () => {
    const known = new Map([
      [canonicalSourceKey(first.sourceId, first.id), "verified-work"],
      [canonicalSourceKey(second.sourceId, second.id), "verified-work"],
    ]);
    const items = [first, second];
    expect(selectSpotlightItems(items, 5, known)).toEqual([first]);
    expect(selectHeroCandidates(items, [], 5, known)).toEqual([first]);
    expect(items).toHaveLength(2);
  });
  it("deduplicates exact source references even when verification index is empty", () => {
    expect(selectSpotlightItems([first, { ...first }], 5, new Map())).toHaveLength(1);
  });
});
