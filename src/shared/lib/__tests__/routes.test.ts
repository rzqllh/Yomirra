import { describe, expect, it } from "vitest";
import {
  getMangaDetailHref,
  getReaderHref,
  getSafeMangaDetailBackHref,
} from "../routes";

describe("route history contracts", () => {
  it("preserves an internal parent through reader and detail URLs", () => {
    const parent = "/library?source=source-a";
    const reader = getReaderHref("source-a", "manga-a", "chapter-1", parent);
    const detail = getMangaDetailHref("source-a", "manga-a", parent);

    expect(reader).toContain("returnTo=%2Flibrary%3Fsource%3Dsource-a");
    expect(detail).toContain("returnTo=%2Flibrary%3Fsource%3Dsource-a");
    expect(getSafeMangaDetailBackHref(parent)).toBe(parent);
  });

  it("rejects reader routes as detail back targets", () => {
    expect(
      getSafeMangaDetailBackHref(
        "/manga/source-a/manga-a/read/chapter-1"
      )
    ).toBeUndefined();
  });

  it("rejects external and protocol-relative back targets", () => {
    expect(
      getSafeMangaDetailBackHref("https://example.com/library")
    ).toBeUndefined();
    expect(getSafeMangaDetailBackHref("//example.com/library")).toBeUndefined();
  });
});
