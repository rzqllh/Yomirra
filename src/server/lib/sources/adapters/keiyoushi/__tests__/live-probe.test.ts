import { describe, expect, it } from "vitest";
import { privateBetaSources, readPrivateBetaCatalog, readPrivateBetaDetail, readPrivateBetaChapter, verifyBetaPageTicket } from "@/server/lib/sources/private-beta";
const enabled=process.env.KEIYOUSHI_LIVE_PROBE==="1";
const describeLive=enabled?describe:describe.skip;
describeLive("Manual authorized native source acceptance",()=>{
  it("checks bounded catalog, search, pagination, detail and permitted chapter references",async()=>{
    // Explicit opt-in is mandatory. Never request account credentials or
    // bypass the existing private-beta allowlist/content/access checks.
    expect(process.env.KEIYOUSHI_PROBE_PERMISSION).toBe("confirmed");
    const source=process.env.KEIYOUSHI_PROBE_SOURCE;
    const requestedTitle=process.env.KEIYOUSHI_PROBE_TITLE?.trim();
    const requestedManga=process.env.KEIYOUSHI_PROBE_MANGA_ID;
    expect(privateBetaSources().some(s=>s.id===source&&s.available)).toBe(true);
    expect(requestedTitle&&requestedTitle.length<=160&&requestedManga).toBeTruthy();
    const id=source!;
    const popular=await readPrivateBetaCatalog(id,"",1,"popular");
    const latest=await readPrivateBetaCatalog(id,"",1,"latest");
    expect(popular.received).toBeGreaterThan(0);
    expect(latest.received).toBeGreaterThan(0);
    const search=await readPrivateBetaCatalog(id,requestedTitle!,1,"search");
    expect(search.items.some(row=>row.id===requestedManga)).toBe(true);
    if(popular.hasNextPage){
      const next=await readPrivateBetaCatalog(id,"",2,"popular");
      expect(next.page).toBe(2);
      expect(next.received).toBeGreaterThan(0);
      expect(next.items.some(row=>!popular.items.some(first=>first.id===row.id))).toBe(true);
    }else throw Error("Pagination not established on selected source");
    const detail=await readPrivateBetaDetail(id,requestedManga!);
    expect(detail.title.trim()).not.toBe("");
    const chapter=detail.chapters.find(row=>row.id===process.env.KEIYOUSHI_PROBE_CHAPTER_ID&&row.readable);
    expect(chapter).toBeDefined();
    // An explicitly approved public chapter is required; no image is fetched
    // and no real user UID, history, token or ticket is printed.
    expect(process.env.KEIYOUSHI_PROBE_CHAPTER_PERMISSION).toBe("confirmed");
    const result=await readPrivateBetaChapter("isolated-native-acceptance",id,requestedManga!,chapter!.id);
    expect(result.pages.length).toBeGreaterThan(0);
    for(const ticket of result.pages){
      expect(verifyBetaPageTicket(ticket,"isolated-native-acceptance")?.source).toBe(id);
      expect(verifyBetaPageTicket(ticket,"unrelated-fixture")).toBeNull();
    }
  },90000);
});
