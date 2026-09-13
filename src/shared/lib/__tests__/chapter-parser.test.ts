import { describe, it, expect } from "vitest";
import {
  extractChapterNumber,
  mapChapterProgress,
  findChapterByNumber,
  type SourceChapterList,
} from "../chapter-parser";

describe("extractChapterNumber", () => {
  it("parses integer chapters", () => {
    expect(extractChapterNumber("Chapter 42")).toBe(42);
    expect(extractChapterNumber("Ch. 100")).toBe(100);
    expect(extractChapterNumber("ch 7")).toBe(7);
  });

  it("parses decimal chapters", () => {
    expect(extractChapterNumber("Chapter 12.5")).toBe(12.5);
    expect(extractChapterNumber("Ch.3.1")).toBe(3.1);
  });

  it("parses chapters without prefix", () => {
    expect(extractChapterNumber("042")).toBe(42);
    expect(extractChapterNumber("7")).toBe(7);
  });

  it("returns null for unparseable strings", () => {
    expect(extractChapterNumber("Extra Chapter")).toBeNull();
    expect(extractChapterNumber("Omake")).toBeNull();
    expect(extractChapterNumber("")).toBeNull();
  });

  it("handles abbreviated formats", () => {
    expect(extractChapterNumber("Chap 15")).toBe(15);
  });
});

describe("findChapterByNumber", () => {
  const chapters: SourceChapterList = [
    { chapterId: "ch1", title: "Chapter 1", chapterNumber: 1 },
    { chapterId: "ch12", title: "Chapter 12", chapterNumber: 12 },
    { chapterId: "ch12-5", title: "Chapter 12.5", chapterNumber: 12.5 },
    { chapterId: "ch100", title: "Chapter 100", chapterNumber: 100 },
  ];

  it("finds exact chapter", () => {
    const result = findChapterByNumber(12, chapters);
    expect(result?.chapterId).toBe("ch12");
  });

  it("finds decimal chapter", () => {
    const result = findChapterByNumber(12.5, chapters);
    expect(result?.chapterId).toBe("ch12-5");
  });

  it("returns null when not found", () => {
    const result = findChapterByNumber(99, chapters);
    expect(result).toBeNull();
  });
});

describe("mapChapterProgress", () => {
  const targetChapters: SourceChapterList = [
    { chapterId: "t1", title: "Chapter 1", chapterNumber: 1 },
    { chapterId: "t5", title: "Chapter 5", chapterNumber: 5 },
    { chapterId: "t10", title: "Chapter 10", chapterNumber: 10 },
    { chapterId: "t11", title: "Chapter 11", chapterNumber: 11 },
    { chapterId: "t20", title: "Chapter 20", chapterNumber: 20 },
  ];

  it("returns EXACT for exact chapter number match", () => {
    const result = mapChapterProgress("Chapter 10", targetChapters);
    expect(result.type).toBe("EXACT");
    if (result.type === "EXACT") {
      expect(result.chapterNumber).toBe(10);
      expect(result.targetChapterId).toBe("t10");
    }
  });

  it("returns UNMAPPED for extra chapters that have no number", () => {
    const result = mapChapterProgress("Extra Chapter", targetChapters);
    expect(result.type).toBe("UNMAPPED");
    if (result.type === "UNMAPPED") {
      expect(result.chapterNumber).toBeNull();
    }
  });

  it("returns UNMAPPED when chapter number not in target list and delta > threshold", () => {
    // Chapter 50 doesn't exist in list of 20 chapters — delta too large
    const result = mapChapterProgress("Chapter 50", targetChapters);
    expect(result.type).toBe("UNMAPPED");
  });

  it("returns PROBABLE when chapter is close but not exact", () => {
    // Chapter 9 is closest to Chapter 10 (delta 1)
    const smallList: SourceChapterList = [
      { chapterId: "t10", title: "Chapter 10", chapterNumber: 10 },
    ];
    const result = mapChapterProgress("Chapter 9", smallList);
    expect(result.type).toBe("PROBABLE");
    if (result.type === "PROBABLE") {
      expect(result.delta).toBe(1);
    }
  });
});
