import { describe, it, expect } from "vitest";
import { compareMilestones } from "../milestone-comparator";
import type { LibraryItem } from "@/shared/store/library-store";

describe("MilestoneComparator (Q52 Strict Structured Precedence)", () => {
  it("resolves decimal chapter numbers accurately without index confusion", () => {
    const itemA: LibraryItem = {
      id: "m1",
      title: "Manga Decimal",
      sourceId: "mangadex",
      mangaId: "md1",
      highestMilestoneChapterTitle: "Chapter 10.5",
      highestMilestoneIndex: 12,
    } as LibraryItem;

    const itemB: LibraryItem = {
      id: "m1",
      title: "Manga Decimal",
      sourceId: "mangadex",
      mangaId: "md1",
      highestMilestoneChapterTitle: "Chapter 10",
      highestMilestoneIndex: 10,
    } as LibraryItem;

    const resA = compareMilestones(itemA, itemB);
    expect(resA.guestWins).toBe(true);
    expect(resA.reason).toContain("Ch. 10.5");
    expect(resA.reason).toContain("Ch. 10");

    const resB = compareMilestones(itemB, itemA);
    expect(resB.guestWins).toBe(false);
  });

  it("never allows large ordinal index to overwrite a higher chapter number", () => {
    const itemA: LibraryItem = {
      id: "m1",
      title: "Manga Inverted",
      sourceId: "source-a",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Chapter 1",
      highestMilestoneIndex: 99,
    } as LibraryItem;

    const itemB: LibraryItem = {
      id: "m1",
      title: "Manga Inverted",
      sourceId: "source-b",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Chapter 15",
      highestMilestoneIndex: 10,
    } as LibraryItem;

    const res = compareMilestones(itemA, itemB);
    expect(res.guestWins).toBe(false);
    expect(res.reason).toContain("Nomor chapter cloud (Ch. 15) lebih tinggi");
  });

  it("compares ordinal indices when chapter numbers are equal and same source", () => {
    const itemA: LibraryItem = {
      id: "m1",
      title: "Same Chapter",
      sourceId: "mangadex",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Chapter 5",
      highestMilestoneIndex: 8,
    } as LibraryItem;

    const itemB: LibraryItem = {
      id: "m1",
      title: "Same Chapter",
      sourceId: "mangadex",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Chapter 5",
      highestMilestoneIndex: 5,
    } as LibraryItem;

    const res = compareMilestones(itemA, itemB);
    expect(res.guestWins).toBe(true);
    expect(res.reason).toContain("Index ordinal lokal (8) lebih tinggi");
  });

  it("correctly handles unnumbered chapters like Prologue vs Chapter 1", () => {
    const prologue: LibraryItem = {
      id: "m1",
      title: "Test",
      sourceId: "s1",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Prologue",
      highestMilestoneIndex: 0,
    } as LibraryItem;

    const ch1: LibraryItem = {
      id: "m1",
      title: "Test",
      sourceId: "s2",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Chapter 1",
      highestMilestoneIndex: 1,
    } as LibraryItem;

    const res = compareMilestones(prologue, ch1);
    expect(res.guestWins).toBe(false);
    expect(res.reason).toContain("Cloud memiliki nomor chapter terverifikasi");
  });

  it("falls back to reading timestamp when both have no parsed numbers and different sources", () => {
    const itemA: LibraryItem = {
      id: "m1",
      title: "Special",
      sourceId: "source-x",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Special Episode Alpha",
      lastReadAt: "2026-10-27T10:00:00Z",
    } as LibraryItem;

    const itemB: LibraryItem = {
      id: "m1",
      title: "Special",
      sourceId: "source-y",
      mangaId: "m1",
      highestMilestoneChapterTitle: "Special Episode Beta",
      lastReadAt: "2026-10-26T10:00:00Z",
    } as LibraryItem;

    const res = compareMilestones(itemA, itemB);
    expect(res.guestWins).toBe(true);
    expect(res.reason).toContain("Timestamp baca lokal lebih baru");
  });

  it("handles Prologue vs Chapter 0 symmetrically without fabricating progress", () => {
    const prologue: LibraryItem = {
      id: "m1",
      title: "Test Prologue",
      sourceId: "s1",
      highestMilestoneChapterTitle: "Prologue",
    } as LibraryItem;

    const ch0: LibraryItem = {
      id: "m1",
      title: "Test Prologue",
      sourceId: "s2",
      highestMilestoneChapterTitle: "Chapter 0",
    } as LibraryItem;

    const res = compareMilestones(ch0, prologue);
    // Numbered Ch. 0 >= 0 wins over Prologue
    expect(res.guestWins).toBe(true);
  });

  it("handles Epilogue vs previous numbered chapter based on reading timestamp", () => {
    const epilogue: LibraryItem = {
      id: "m1",
      title: "Test Epilogue",
      sourceId: "s1",
      highestMilestoneChapterTitle: "Epilogue - Final Chapter",
      lastReadAt: "2026-10-28T12:00:00Z",
    } as LibraryItem;

    const ch50: LibraryItem = {
      id: "m1",
      title: "Test Epilogue",
      sourceId: "s2",
      highestMilestoneChapterTitle: "Chapter 50",
      lastReadAt: "2026-10-27T12:00:00Z",
    } as LibraryItem;

    const res = compareMilestones(epilogue, ch50);
    // Newer epilogue wins over earlier numbered chapter
    expect(res.guestWins).toBe(true);
    expect(res.reason).toContain("Epilog");
  });
});