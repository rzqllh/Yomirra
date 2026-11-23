import { describe, it, expect } from "vitest";
import { DEFAULT_DISABLED_SOURCE_IDS, applyDefaultDisabledSources } from "../source-defaults";
import { parseDisabledSourceIdsCookie } from "../discovery-source-policy";

describe("default inactive sources", () => {
  it("preserves sources confirmed to work", () => {
    expect(DEFAULT_DISABLED_SOURCE_IDS).not.toContain("shinigami");
    expect(DEFAULT_DISABLED_SOURCE_IDS).not.toContain("komiku-ii");
    expect(DEFAULT_DISABLED_SOURCE_IDS).not.toContain("asurascans");
  });
  it("keeps unfinished providers inactive by default", () => {
    expect(DEFAULT_DISABLED_SOURCE_IDS).toEqual(expect.arrayContaining([
      "komikindo", "komiku", "komiknesia", "westmanga", "mangadex", "doujindesu",
    ]));
    expect(applyDefaultDisabledSources(["komiku", "custom"])).toEqual(
      expect.arrayContaining(["komiku", "custom", "mangadex"])
    );
    expect(parseDisabledSourceIdsCookie(undefined)).toEqual([...DEFAULT_DISABLED_SOURCE_IDS]);
    expect(parseDisabledSourceIdsCookie(encodeURIComponent(JSON.stringify(["asurascans"])))).toEqual(["asurascans"]);
  });
});
