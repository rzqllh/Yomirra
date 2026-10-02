import { describe, expect, it } from "vitest";
import { getMangaTransitionNames } from "../transition-identity";

describe("getMangaTransitionNames", () => {
  it("returns stable card, cover, and title identities", () => {
    expect(getMangaTransitionNames("source-a", "series-42")).toEqual({
      card: "manga-card-source-a-series-42",
      cover: "manga-cover-source-a-series-42",
      title: "manga-title-source-a-series-42",
    });
  });

  it("normalizes characters that are unsafe in CSS transition names", () => {
    expect(getMangaTransitionNames("source/a", "series:42?x=1")).toEqual({
      card: "manga-card-source-a-series-42-x-1",
      cover: "manga-cover-source-a-series-42-x-1",
      title: "manga-title-source-a-series-42-x-1",
    });
  });
});
