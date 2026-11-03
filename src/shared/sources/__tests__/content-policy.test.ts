import { describe, expect, it } from "vitest";
import { classifyContent, isContentVisible, shouldHideNsfw, sourceReadScope } from "../content-policy";

describe("tri-state content classification", () => {
  it("never guesses that missing or explicitly unknown ratings are SAFE", () => {
    expect(classifyContent({})).toBe("UNKNOWN");
    expect(classifyContent({ contentRating: "unknown", isNsfw: false })).toBe("UNKNOWN");
    expect(classifyContent({ contentRating: "safe" })).toBe("SAFE");
  });

  it("keeps confirmed restricted and suggestive ratings hidden with NSFW OFF", () => {
    for (const item of [
      { isNsfw: true },
      { contentRating: "suggestive" as const },
      { contentRating: "erotica" as const },
      { contentRating: "pornographic" as const },
      { contentRating: "safe" as const, isNsfw: true },
    ]) {
      expect(classifyContent(item)).toBe("NSFW");
      expect(isContentVisible(item)).toBe(false);
      expect(isContentVisible(item, false)).toBe(true);
    }
  });

  it("permits unverified records only as UNKNOWN, never as inferred SAFE", () => {
    expect(isContentVisible({ contentRating: "unknown" })).toBe(true);
    expect(isContentVisible({})).toBe(true);
    expect(isContentVisible({ isNsfw: true, contentRating: "unknown" })).toBe(false);
    expect(shouldHideNsfw(undefined)).toBe(true);
  });

  it("changes safe cache scope to avoid reusing pre-warning catalog cache", () => {
    expect(sourceReadScope()).toContain("safe-v2");
    expect(sourceReadScope({ hideNsfw: false })).toContain("opt-in-v1");
    expect(sourceReadScope()).not.toEqual(sourceReadScope({ hideNsfw: false }));
  });
});
