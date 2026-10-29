import { describe, expect, it } from "vitest";
import { retainHistory, historyId } from "../history-retention";
import type { HistoryItem } from "@/shared/store/history-store";

const item = (mangaId: string, chapterNumber: number, readAt: number): HistoryItem => ({
  sourceId: "source", mangaId, chapterId: `ch-${chapterNumber}`, chapterNumber,
  mangaTitle: mangaId, readAt, pageIndex: 7, pageOffset: 123, coverUrl: "large-cover",
});

describe("reading progress retention", () => {
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

  it("does not expire a title after three months of inactivity", () => {
    const entry = item("old-title", 100, 1);
    expect(retainHistory({ [historyId(entry)]: entry })[historyId(entry)]).toBeDefined();
  });
});
