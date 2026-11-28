import { describe, expect, it, vi } from "vitest";
import { GenericWpEngine } from "../generic-wp";
import { MangaThemesiaEngine } from "../mangathemesia";
import { MadaraEngine } from "../madara";
import { NatsuIdEngine } from "../natsuid";
import { HttpClient } from "../../base/http-client";
import { normalizeStagedChapters, stagedChapterLock } from "../normalize-catalog";

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

describe("shared staged chapter identity",()=>{
  const base="https://example.test";
  const config={id:"fixture",name:"Fixture",baseUrl:base,category:"SFW" as const,isNsfw:false};
  it("rejects conflicting chapter lock observations on all shared HTML engines",async()=>{
    const spy=vi.spyOn(HttpClient.prototype,"getHtml");
    try{
      for(const [engine,html] of [
        [new MangaThemesiaEngine(config),'<div id="chapterlist"><ul><li><a href="/chapter-1/">Chapter 1</a></li><li class="locked"><a href="/chapter-1/">Chapter 1</a></li></ul></div>'],
        [new MadaraEngine(config),'<ul><li class="wp-manga-chapter"><a href="/chapter-1/">Chapter 1</a></li><li class="wp-manga-chapter locked"><a href="/chapter-1/">Chapter 1</a></li></ul>'],
        [new NatsuIdEngine(config),'<div id="chapterlist"><a href="/chapter-1/">Chapter 1</a><a class="locked" href="/chapter-1/">Chapter 1</a></div>'],
        [new GenericWpEngine(config),'<div id="chapterlist"><ul><li><a href="/chapter-1/">Chapter 1</a></li><li class="locked"><a href="/chapter-1/">Chapter 1</a></li></ul></div>']
      ] as const){
        spy.mockResolvedValueOnce(html);
        await expect(engine.getChapters("fixture")).rejects.toMatchObject({code:"SCHEMA_CHANGED"});
      }
    }finally{spy.mockRestore();}
  });
  it("keeps absent or ambiguous lock evidence unknown and honors explicit lock markers",async()=>{
    expect(stagedChapterLock(false)).toBeUndefined();
    expect(stagedChapterLock(false,"unknown","false")).toBeUndefined();
    expect(stagedChapterLock(false,"false")).toBe(false);
    expect(stagedChapterLock(true,"false")).toBe(true);
    expect(stagedChapterLock(false,"false","true")).toBe(true);
    const spy=vi.spyOn(HttpClient.prototype,"getHtml").mockResolvedValue('<div id="chapterlist"><ul><li><a href="/chapter-1/">Chapter 1</a></li><li data-locked="false"><a href="/chapter-2/">Chapter 2</a></li><li class="locked" data-locked="false"><a href="/chapter-3/">Chapter 3</a></li></ul></div>');
    try{
      for(const Engine of [MangaThemesiaEngine,GenericWpEngine]){
        const chapters=await new Engine(config).getChapters("fixture");
        expect(chapters.map(c=>c.isLocked)).toEqual([undefined,false,true]);
      }
    }finally{spy.mockRestore();}
  });
  it("retains explicit chapter zero independently of its display label",async()=>{
    const spy=vi.spyOn(HttpClient.prototype,"getHtml").mockResolvedValue('<div id="chapterlist"><ul><li data-num="0"><a href="/chapter-0/">Prologue</a></li></ul></div>');
    try{
      expect(await new MangaThemesiaEngine(config).getChapters("fixture")).toMatchObject([{id:"chapter-0",number:0,chapterNumber:"0",title:"Prologue"}]);
    }finally{spy.mockRestore();}
  });
});
