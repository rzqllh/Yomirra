import { describe, expect, it } from "vitest";
import type { Chapter } from "@/shared/sources/source-types";
import { readChapterNumberEvidence, suggestAlternateChapter } from "../alternate-chapter-mapping";

const chapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: "target-10", mangaId: "work", title: "Chapter 10", number: 10, date: "", isLocked: false, ...overrides,
});

describe("alternate chapter navigation evidence", () => {
  it("requires a complete numeric label, not an opaque identifier or special", () => {
    expect(readChapterNumberEvidence("Vol. 2 Ch. 14.5")).toEqual({ number: 14.5, volume: 2 });
    for (const label of ["Extra Chapter 10", "Chapter 10 Part 2", "abc10", "Chapter 10.1.2", "Chapter 10-11", "Chapter", ""]) {
      expect(readChapterNumberEvidence(label)).toBeNull();
    }
  });
  it("suggests one explicitly unlocked chapter from the selected work", () => {
    expect(suggestAlternateChapter("Chapter 10", "work", [chapter()])).toMatchObject({
      type: "EXACT", number: 10, chapter: { id: "target-10" },
    });
    expect(suggestAlternateChapter("Chapter 10", "work", [chapter({ mangaId: "other" })])).toEqual({ type: "UNMAPPED" });
  });
  it("does not infer access or numbering from fallback indexes", () => {
    for (const c of [chapter({ isLocked: true }), chapter({ isLocked: undefined }), chapter({ title: "Special" }), chapter({ title: "Chapter 11", chapterNumber: "10" })]) {
      expect(suggestAlternateChapter("Chapter 10", "work", [c])).toEqual({ type: "UNMAPPED" });
    }
  });
  it("does not advance, ignore volume conflict, or silently pick an edition", () => {
    expect(suggestAlternateChapter("Chapter 9", "work", [chapter()])).toEqual({ type: "UNMAPPED" });
    expect(suggestAlternateChapter("Chapter 10", "work", [chapter({ title: "Vol. 2 Chapter 10", chapterNumber: "Vol. 1 Chapter 10" })])).toEqual({ type: "UNMAPPED" });
    expect(suggestAlternateChapter("Vol. 2 Chapter 10", "work", [chapter({ volume: "1" })])).toEqual({ type: "UNMAPPED" });
    expect(suggestAlternateChapter("Chapter 10", "work", [chapter(), chapter({ id: "other-edition", isLocked: true })])).toEqual({ type: "AMBIGUOUS", number: 10 });
    expect(suggestAlternateChapter("Vol. 2 Chapter 10", "work", [chapter({ volume: "2" }), chapter({ id: "other-volume", volume: "1" })])).toMatchObject({ type: "EXACT" });
  });
});
