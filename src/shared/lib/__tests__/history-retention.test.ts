import { describe, expect, it } from "vitest";
import { retainHistory, historyId } from "../history-retention";
import type { HistoryItem } from "@/shared/store/history-store";
import { deriveSmartCollections } from "../smart-collections";

const item = (mangaId: string, chapterNumber: number, readAt: number): HistoryItem => ({
  sourceId: "source", mangaId, chapterId: `ch-${chapterNumber}`, chapterNumber,
  mangaTitle: mangaId, readAt, pageIndex: 7, pageOffset: 123, coverUrl: "large-cover",
});

describe("reading progress retention", () => {
  it.each([
    { seriesProgressPercent: 100 },
    { chapterIndex: 49, totalChapters: 50 },
  ])("preserves finished-series classification after compaction: %j", (completion) => {
    const finished = { ...item("finished", 50, 1), ...completion, status: "COMPLETED" };
    const input = Object.fromEntries(Array.from({ length: 512 }, (_, index) => {
      const entry = item(`new-${index}`, 1, index + 2);
      return [historyId(entry), entry];
    }));
    input[historyId(finished)] = finished;
    const retained = retainHistory(input);
    const compact = retained[historyId(finished)];
    expect(compact).toMatchObject({ ...completion, status: "COMPLETED", isCompact: true });
    expect(Object.values(retained).filter(entry => !entry.isCompact)).toHaveLength(512);

    const library = [{
      id: "finished", sourceId: "source", mangaId: "finished", title: "Finished",
      status: "COMPLETED", addedAt: "2020-01-01", updatedAt: "2020-01-01",
    }];
    const collections = deriveSmartCollections(library, [compact], { now: Date.UTC(2026, 9, 30) });
    for (const id of ["continue-reading", "stale", "completed-unfinished"]) {
      expect(collections.find(collection => collection.id === id)?.items).toEqual([]);
    }
    expect(retainHistory(retained)).toEqual(retained);
  });

  it("keeps 512 details and compact resume records for every older title", () => {
    const input = Object.fromEntries(Array.from({ length: 1200 }, (_, i) => {
      const entry = item(`title-${i}`, 1, i + 1);
      return [historyId(entry), entry];
    }));
    const output = retainHistory(input);
    expect(Object.values(output).filter(entry => !entry.isCompact)).toHaveLength(512);
    expect(Object.keys(output)).toHaveLength(1200);
    expect(output["source::title-0::ch-1"]).toMatchObject({ isCompact: true, pageIndex: 7, pageOffset: 123 });
    expect(output["source::title-0::ch-1"].coverUrl).toBeUndefined();
    expect(retainHistory(output)).toEqual(output);
  });

  it("preserves latest reread cursor and highest milestone across linked sources", () => {
    const entries = [item("old", 100, 1), item("new", 20, 2), item("old", 30, 0.5)];
    const input = Object.fromEntries(entries.map(entry => [historyId(entry), { ...entry, savedTitleId: "canonical", isCompact: true }]));
    const output = retainHistory(input);
    expect(Object.values(output).map(entry => entry.chapterNumber).sort((a, b) => a! - b!)).toEqual([20, 100]);
    expect(output["source::new::ch-20"].pageIndex).toBe(7);
  });


  it("preserves a verified old milestone when newer open-only chapters exceed 512 details", () => {
    const opened = Array.from({ length: 600 }, (_, index) => {
      const entry: HistoryItem = {
        sourceId: "source", mangaId: "one-title",
        chapterId: `ch-${index}`, chapterNumber: index,
        mangaTitle: "One Title", readAt: 1000 + index,
      };
      return [historyId(entry), entry] as const;
    });
    const milestone: HistoryItem = {
      sourceId: "source", mangaId: "one-title", chapterId: "ch-30",
      chapterNumber: 30, mangaTitle: "One Title", readAt: 1, pageIndex: 7,
    };
    const input = Object.fromEntries(opened);
    input[historyId(milestone)] = milestone;
    const output = retainHistory(input);
    expect(Object.values(output).filter(entry => !entry.isCompact)).toHaveLength(512);
    expect(output[historyId(milestone)]).toMatchObject({ pageIndex: 7, isCompact: true });
    expect(output["source::one-title::ch-599"]).toBeDefined();
    expect(retainHistory(output)).toEqual(output);
  });

  it("does not expire a title after three months of inactivity", () => {
    const entry = item("old-title", 100, 1);
    expect(retainHistory({ [historyId(entry)]: entry })[historyId(entry)]).toBeDefined();
  });
});
