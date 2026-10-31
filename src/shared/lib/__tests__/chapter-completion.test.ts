import { describe, it, expect } from "vitest";
import { canCompleteChapter } from "../chapter-completion";

describe("Q90 failure-aware chapter completion", () => {
  const pages = [{ url: "https://example.com/p0" }, { url: "https://example.com/p1" }, { url: "https://example.com/p2" }];
  it("refuses empty, partially decoded, or unverified chapters", () => {
    expect(canCompleteChapter([], new Set(), new Set())).toBe(false);
    expect(canCompleteChapter(pages, new Set([0, 2]), new Set())).toBe(false);
  });
  it("does not accept success from unrelated pages as evidence for a missing page", () => {
    expect(canCompleteChapter(pages, new Set([0, 2, 99]), new Set())).toBe(false);
  });
  it("refuses a chapter with any failed page", () => {
    expect(canCompleteChapter(pages, new Set([0, 1, 2]), new Set([1]))).toBe(false);
  });
  it("permits explicit completion after all pages decoded without failure", () => {
    expect(canCompleteChapter(pages, new Set([0, 1, 2]), new Set())).toBe(true);
    expect(canCompleteChapter([{ url: "" }], new Set([0]), new Set())).toBe(false);
  });
});
