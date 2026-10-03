import { describe, expect, it } from "vitest";
import {
  resolveChapterAnchorIndex,
  resolveContinueChapterId,
} from "../chapter-continuity";

const chapters = [
  { id: "chapter-81" },
  { id: "chapter-80.5" },
  { id: "chapter-special" },
  { id: "chapter-80" },
];

describe("chapter continuity", () => {
  it("anchors by stable chapter ID without numeric coercion", () => {
    expect(resolveChapterAnchorIndex(chapters, "chapter-80.5")).toBe(1);
    expect(resolveChapterAnchorIndex(chapters, "chapter-special")).toBe(2);
  });

  it("supports encoded stable IDs", () => {
    expect(
      resolveChapterAnchorIndex([{ id: "bonus/chapter" }], "bonus%2Fchapter")
    ).toBe(0);
  });

  it("keeps an in-progress chapter as the continue target", () => {
    expect(
      resolveContinueChapterId(chapters, {
        chapterId: "chapter-80",
        progressPercent: 60,
      })
    ).toBe("chapter-80");
  });

  it("advances a completed chapter to the next newer usable chapter", () => {
    expect(
      resolveContinueChapterId(chapters, {
        chapterId: "chapter-80",
        progressPercent: 100,
      })
    ).toBe("chapter-special");
  });

  it("does not auto-advance into a locked chapter", () => {
    expect(
      resolveContinueChapterId(
        [{ id: "chapter-81", isLocked: true }, { id: "chapter-80" }],
        { chapterId: "chapter-80", progressPercent: 100 }
      )
    ).toBe("chapter-80");
  });
});
