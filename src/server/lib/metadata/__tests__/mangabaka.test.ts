import { describe, expect, it } from "vitest";
import { parseMangaBakaWork } from "../mangabaka";

const fixture = {
  id: 1995, state: "active", type: "manga", content_rating: "safe",
  titles: [
    { language: "ja-Latn", title: "Sousou no Frieren", is_primary: true },
    { language: "en", title: "Frieren: Beyond Journey's End", is_primary: true },
  ],
  source: { my_anime_list: { description: "Not imported" } },
};
describe("MangaBaka v2 response boundary", () => {
  it("selects the primary English title and retains romanized aliases without third-party payloads", () => {
    expect(parseMangaBakaWork(fixture)).toEqual({
      provider: "mangabaka", externalId: 1995, title: "Frieren: Beyond Journey's End",
      aliases: ["Sousou no Frieren", "Frieren: Beyond Journey's End"], format: "manga", contentRating: "safe",
    });
  });
  it("rejects incomplete, merged, non-comic, and restricted records", () => {
    for (const invalid of [{...fixture, titles: []}, {...fixture, state: "merged"}, {...fixture, type: "novel"}, {...fixture, content_rating: "erotica"}]) {
      expect(parseMangaBakaWork(invalid)).toBeNull();
    }
  });
});
