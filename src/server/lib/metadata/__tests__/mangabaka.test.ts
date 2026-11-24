import { afterEach, describe, expect, it, vi } from "vitest";
import { matchMangaBakaWorks, parseMangaBakaWork } from "../mangabaka";

vi.mock("@/server/lib/cache/redis-cache", () => ({
  withCache: async (_key: string, load: () => Promise<unknown>) => load(),
}));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const fixture = {
  id: 1995, state: "active", type: "manga", content_rating: "safe",
  titles: [
    { language: "ja-Latn", title: "Sousou no Frieren", is_primary: true },
    { language: "en", title: "Frieren: Beyond Journey's End", is_primary: true },
  ],
  source: { my_anime_list: { description: "Not imported" } },
};
describe("MangaBaka v2 response boundary", () => {
  it("does not access the API without explicit permitted-use configuration", async () => {
    vi.stubEnv("YOMIRRA_MANGABAKA_METADATA", "");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await matchMangaBakaWorks("Sousou no Frieren")).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requests a documented match and full record when aliases are missing", async () => {
    vi.stubEnv("YOMIRRA_MANGABAKA_METADATA", "permitted");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T00:00:00Z"));
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 200, data: [{ id: 1995, type: "manga", content_rating: "safe" }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 200, data: fixture })));
    vi.stubGlobal("fetch", fetcher);
    const pending = matchMangaBakaWorks("Sousou no Frieren");
    await vi.advanceTimersByTimeAsync(450);
    expect(await pending).toEqual([parseMangaBakaWork(fixture)]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toBe("https://api.mangabaka.org/v2/series/match?q=Sousou+no+Frieren");
    expect(String(fetcher.mock.calls[1][0])).toBe("https://api.mangabaka.org/v2/series/1995?schema=full");
  });
  it("selects the primary English title and retains romanized aliases without third-party payloads", () => {
    expect(parseMangaBakaWork(fixture)).toEqual({
      provider: "mangabaka", externalId: 1995, title: "Frieren: Beyond Journey's End",
      aliases: ["Sousou no Frieren", "Frieren: Beyond Journey's End"], format: "manga", contentRating: "safe",
    });
  });
  it("retains documented top-level author identities and rejects nested raw source payloads",()=>{
    const work=parseMangaBakaWork({...fixture,authors:[" Author A ","Author A",null],source:{author:"Do not import"}});
    expect(work?.authors).toEqual(["Author A"]);
    expect(work).not.toHaveProperty("source");
  });
  it("retains only normalized documented external identifiers", () => {
    const work = parseMangaBakaWork({...fixture,source_ids:{my_anime_list:126287,anilist:"118586",manga_updates:"https://example.com/untrusted"}});
    expect(work?.externalWorkIds).toEqual({my_anime_list:"126287",anilist:"118586"});
  });

  it("preserves explicit canonical classification in internal rating mode only", () => {
    for (const rating of ["safe","suggestive","erotica","pornographic"] as const) {
      expect(parseMangaBakaWork({...fixture,content_rating:rating},true)?.contentRating).toBe(rating);
    }
    expect(parseMangaBakaWork({...fixture,content_rating:"unrecognized"},true)).toBeNull();
  });
  it("rejects incomplete, merged, non-comic, and restricted records", () => {
    for (const invalid of [{...fixture, titles: []}, {...fixture, state: "merged"}, {...fixture, type: "novel"}, {...fixture, content_rating: "erotica"}]) {
      expect(parseMangaBakaWork(invalid)).toBeNull();
    }
  });
});
