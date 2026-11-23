import { describe, expect, it } from "vitest";
import { selectHeroCandidates, selectRecentlyUpdatedItems, selectSourceLeaderboardEntries, selectSpotlightItems, type HomeFeedManga } from "../home-feed-selection";
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
  it("does not hide unrelated same-title works in the recently-updated shelf", () => {
    expect(selectRecentlyUpdatedItems([first, second], new Set(), 50, new Map())).toEqual([first, second]);
  });
  it("dedupes only confirmed work and exact source references in recently-updated", () => {
    const verified = new Map([
      [canonicalSourceKey(first.sourceId, first.id), "verified-work"],
      [canonicalSourceKey(second.sourceId, second.id), "verified-work"],
    ]);
    expect(selectRecentlyUpdatedItems([first, second], new Set(), 50, verified)).toEqual([first]);
    expect(selectRecentlyUpdatedItems([first, { ...first }], new Set(), 50, new Map())).toEqual([first]);
  });
  it("does not resurface verified alternate sources when already in Continue Reading", () => {
    const verified = new Map([
      [canonicalSourceKey(first.sourceId, first.id), "verified-work"],
      [canonicalSourceKey(second.sourceId, second.id), "verified-work"],
    ]);
    expect(selectRecentlyUpdatedItems([first, second], new Set(["verified-work"]), 50, verified)).toEqual([]);
  });
  it("keeps different same-title titles in per-source rankings", () => {
    const collision = { ...first, id: "unrelated-id" };
    expect(selectSourceLeaderboardEntries([first, collision], first.sourceId)).toEqual([first, collision]);
  });
  it("does not show duplicate exact source records in per-source rankings", () => {
    expect(selectSourceLeaderboardEntries([first, { ...first }], first.sourceId)).toEqual([first]);
    expect(selectSourceLeaderboardEntries([first, second], first.sourceId)).toEqual([first]);
  });
});
