import { describe, expect, it } from "vitest";
import { canonicalSourceKey } from "../canonical-identity";
import { reconcileLibraryItem } from "../library-identity";
import type { LibraryItem } from "@/shared/store/library-store";

const anchor: LibraryItem = {
  id: "stable-id",
  sourceId: "provider-a",
  mangaId: "series-a",
  title: "Independent Series",
  addedAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-20T00:00:00Z",
  lastReadChapterId: "a-1",
  lastReadChapterTitle: "Chapter 1",
  lastReadAt: "2026-11-02T00:00:00Z",
  highestMilestoneChapterId: "a-5",
  highestMilestoneChapterTitle: "Chapter 5",
  highestMilestoneIndex: 5,
};

describe("saved identity progress reconciliation", () => {
  it("preserves the newer cursor and maximum milestone when another device saved the same exact title", () => {
    const duplicate: LibraryItem = {
      ...anchor,
      id: "duplicate-id",
      addedAt: "2026-11-03T00:00:00Z",
      updatedAt: "2026-11-03T00:00:00Z",
      lastReadChapterId: "a-3",
      lastReadChapterTitle: undefined,
      lastReadAt: "2026-11-03T00:00:00Z",
      highestMilestoneChapterId: "a-3",
      highestMilestoneChapterTitle: "Chapter 3",
      highestMilestoneIndex: 3,
    };
    const expected = {
      id: "stable-id",
      savedTitleAliases: ["duplicate-id"],
      lastReadChapterId: "a-3",
      lastReadChapterTitle: undefined,
      lastReadAt: "2026-11-03T00:00:00Z",
      highestMilestoneChapterId: "a-5",
      highestMilestoneChapterTitle: "Chapter 5",
      highestMilestoneIndex: 5,
    };
    const result = reconcileLibraryItem({ a: anchor }, duplicate, "sync");
    expect(Object.keys(result.items)).toEqual(["stable-id"]);
    expect(result.item).toMatchObject(expected);
    expect(reconcileLibraryItem({ b: duplicate }, anchor, "sync").item).toMatchObject(expected);
  });

  it("keeps progress isolated and combines repeated observations of the alternative provider", () => {
    const alternateKey = canonicalSourceKey("provider-b", "series-b");
    const saved: LibraryItem = {
      ...anchor,
      progressBySource: { [alternateKey]: {
        lastReadChapterId: "b-2",
        lastReadAt: "2026-11-20T00:00:00Z",
        highestMilestoneChapterId: "b-2",
        highestMilestoneIndex: 2,
      } },
    };
    const duplicate: LibraryItem = {
      ...anchor,
      id: "duplicate-id",
      primarySourceId: "provider-b",
      primaryMangaId: "series-b",
      addedAt: "2026-11-03T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
      lastReadChapterId: "b-1",
      lastReadChapterTitle: "Chapter 1",
      lastReadAt: "2026-11-10T00:00:00Z",
      highestMilestoneChapterId: "b-8",
      highestMilestoneChapterTitle: "Chapter 8",
      highestMilestoneIndex: 8,
    };
    const result = reconcileLibraryItem({ a: saved }, duplicate, "sync").item;
    expect(result).toMatchObject({ lastReadChapterId: "a-1", highestMilestoneIndex: 5 });
    expect(result.progressBySource?.[alternateKey]).toEqual({
      lastReadChapterId: "b-2",
      lastReadAt: "2026-11-20T00:00:00Z",
      highestMilestoneChapterId: "b-8",
      highestMilestoneChapterTitle: "Chapter 8",
      highestMilestoneIndex: 8,
    });
  });
});
