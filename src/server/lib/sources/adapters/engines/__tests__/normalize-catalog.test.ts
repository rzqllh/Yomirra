import { describe, expect, it, vi } from "vitest";
import { normalizeStagedCatalog, normalizeStagedMediaUrl, sameProviderUrl, stagedDetailIdentity, stagedComicFormat } from "../normalize-catalog";
import { MangaThemesiaEngine } from "../mangathemesia";
import { HttpClient } from "../../base/http-client";
import * as cheerio from "cheerio";
import { GenericWpEngine } from "../generic-wp";
import { matchCanonicalMetadata, inheritCanonicalRating } from "@/shared/lib/metadata-catalog";

const base = "https://example.test";
describe("staged native engine normalization", () => {
  it("rejects off-origin, traversal, credentials and non-HTTPS identities", () => {
    for (const id of ["https://other.test/manga/a", "//example.test/manga/a", "../a", "%2e%2e/a", "a%2fb", "https://user@example.test/a", "javascript:alert(1)", "http://example.test/a", "?q=x"]) {
      expect(sameProviderUrl(id, base)).toBeNull();
    }
    expect(sameProviderUrl("manga/fixture/", base)?.pathname).toBe("/manga/fixture/");
  });
  it("normalizes relative covers and deduplicates identical observations without inferring ratings", () => {
    const row = { id: "fixture", title: " Example  Work ", coverUrl: "/cover.jpg" };
    expect(normalizeStagedCatalog({ mangas: [row, row], hasNextPage: true }, base, "fixture")).toEqual({
      mangas: [{ id: "fixture", title: "Example Work", coverUrl: base + "/cover.jpg" }], hasNextPage: true,
    });
    expect(() => normalizeStagedCatalog({ mangas: [row, { ...row, title: "Different work" }], hasNextPage: false }, base, "fixture")).toThrow();
    expect(normalizeStagedMediaUrl("javascript:alert(1)", base)).toBe("");
  });
  it("rejects foreign links and does not infer a safe rating from the source", async () => {
    const adapter = new MangaThemesiaEngine({ id: "fixture", name: "Fixture", baseUrl: base, category: "SFW", isNsfw: false });
    const get = vi.spyOn(HttpClient.prototype, "getHtml").mockResolvedValue(
      '<div class="bsx"><a href="https://other.test/manga/a/" title="Foreign"><img src="/wrong.jpg"></a></div>' +
      '<div class="bsx"><a href="/manga/local/" title="Local"><img src="/cover.jpg"></a></div>'
    );
    try {
      const result = await adapter.getPopular(1);
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0]).toMatchObject({ id: "local", coverUrl: base + "/cover.jpg", contentRating: "unknown" });
      await expect(adapter.getDetail("https://other.test/manga/a/")).rejects.toThrow();
      expect(get).toHaveBeenCalledTimes(1);
      get.mockResolvedValueOnce("<html><body>Unexpected response</body></html>");
      await expect(adapter.getDetail("local")).rejects.toMatchObject({ code: "PARSER_BROKEN" });
    } finally { get.mockRestore(); }
  });
});

describe("canonical identity evidence from staged details",()=>{
  it("uses explicit labeled format and aliases, never the site language",async()=>{
    const html='<h1 class="entry-title">Fixture</h1><div class="tsinfo"><div class="imptdt">Type <i>Manhwa</i></div><div class="imptdt">Author <i>Author A</i></div><div class="imptdt">Alternative titles <i>Native name; Other name</i></div></div>';
    const spy=vi.spyOn(HttpClient.prototype,"getHtml").mockResolvedValue(html);
    try{
      for(const Engine of [MangaThemesiaEngine,GenericWpEngine]){
        const source=new Engine({id:"fixture",name:"Fixture",baseUrl:base,category:"SFW",isNsfw:false});
        const detail=await source.getDetail("fixture");
        expect(detail).toMatchObject({format:"manhwa",author:"Author A",alternativeTitles:["Native name","Other name"],contentRating:"unknown"});
        const canonical={provider:"mangabaka" as const,externalId:42,title:"Native name",aliases:["Native name"],authors:["Author A"],format:"manhwa" as const,contentRating:"safe" as const};
        expect(inheritCanonicalRating(detail,matchCanonicalMetadata(detail,[canonical])).contentRating).toBe("safe");
      }
    }finally{spy.mockRestore();}
  });
  it("rejects ambiguous and inferred formats",()=>{
    expect(stagedDetailIdentity(cheerio.load('<div class="tsinfo"><div class="imptdt">Type <i>Manga</i></div><div class="imptdt">Type <i>Manhwa</i></div></div>'))).not.toHaveProperty("format");
    expect(stagedComicFormat("Korean")).toBeUndefined();
    expect(stagedComicFormat("Long Strip")).toBeUndefined();
  });
});
