import { describe, expect, it, vi } from "vitest";
import { GenericWpEngine } from "../generic-wp";
import { HttpClient } from "../../base/http-client";
import { normalizeStagedChapters } from "../normalize-catalog";

describe("staged generic series identity", () => {
  it("preserves route family and refuses arbitrary paths", async () => {
    const engine = new GenericWpEngine({id:"fixture",name:"Fixture",baseUrl:"https://example.test",category:"SFW",isNsfw:false});
    const get = vi.spyOn(HttpClient.prototype,"getHtml").mockResolvedValueOnce(
      '<article><a href="/comic/same/" title="Comic"></a></article>'+
      '<article><a href="/series/same/" title="Series"></a></article>'+
      '<article><a href="/manga/same/" title="Manga"></a></article>'+
      '<article><a href="/account/settings/" title="Invalid"></a></article>'
    ).mockResolvedValue('<h1>Fixture detail</h1>');
    try {
      const rows = await engine.search("fixture",1);
      expect(rows.mangas.map(m=>m.id)).toEqual(["comic/same","series/same","same"]);
      await engine.getDetail("comic/same");
      await engine.getDetail("series/same");
      await engine.getDetail("same");
      expect(get.mock.calls.slice(1).map(c=>c[0])).toEqual(["/comic/same/","/series/same/","/manga/same/"]);
      await expect(engine.getDetail("account/settings")).rejects.toThrow();
      await expect(engine.getDetail("https://example.test/comic/same/")).rejects.toThrow();
      expect(get).toHaveBeenCalledTimes(4);
    } finally { get.mockRestore(); }
  });
  it("deduplicates only consistent chapter observations", () => {
    const row={id:"chapter-1",mangaId:"comic/same",title:"Chapter 1",number:1,date:"",url:"https://example.test/chapter-1/",isLocked:false};
    expect(normalizeStagedChapters([row,row],"comic/same","https://example.test","fixture")).toEqual([row]);
    expect(()=>normalizeStagedChapters([row,{...row,isLocked:true}],"comic/same","https://example.test","fixture")).toThrow();
  });
});
