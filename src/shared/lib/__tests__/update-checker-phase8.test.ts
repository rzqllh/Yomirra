import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "@/shared/store/library-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourceHealthStore } from "@/shared/store/source-health-store";
import { scanLibraryUpdates } from "../update-checker";
import { apiClient } from "@/shared/api-client";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getChapters: vi.fn(),
    getDetail: vi.fn(),
  },
}));

describe("Phase 8 — Source-Agnostic Update Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
    useUpdateStore.setState({ items: {} });
    useSettingsStore.setState({
      perTitleSourcePreferences: {},
      routingMode: "PREFERRED",
      globalSourceOrder: [],
      preferredLanguages: ["id", "en"],
    });
    useSourceHealthStore.setState({ healthBySource: {} });
  });

  it("1. healthy primary detects update normally", async () => {
    useLibraryStore.setState({
      items: {
        "title-1": {
          id: "title-1",
          sourceId: "mangadex",
          mangaId: "solo-leveling",
          title: "Solo Leveling",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch-100", number: 100, title: "Chapter 100" },
    ]);

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);

    const update = useUpdateStore.getState().items["title-1"];
    expect(update).toBeDefined();
    expect(update.latestChapterId).toBe("ch-100");
    expect(update.latestChapterNumber).toBe(100);
    expect(update.detectedSourceId).toBe("mangadex");
    expect(update.isAlternateSource).toBe(false);
  });

  it("2. broken primary uses confirmed alternate and isolates failure", async () => {
    useLibraryStore.setState({
      items: {
        "title-2": {
          id: "title-2",
          sourceId: "broken-src",
          mangaId: "manga-2",
          title: "Omniscient Reader",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "healthy-alt",
              mangaId: "alt-manga-2",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // Primary throws error; alternate succeeds
    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "broken-src") {
        return Promise.reject(new Error("503 Service Unavailable"));
      }
      if (sourceId === "healthy-alt") {
        return Promise.resolve([
          { id: "alt-ch-55", mangaId:"alt-manga-2",isLocked:false,number: 55, title: "Chapter 55" },
        ]);
      }
      return Promise.resolve([]);
    });

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);
    // Failure was isolated because alternate succeeded!
    expect(res.errors.length).toBe(0);

    const update = useUpdateStore.getState().items["title-2"];
    expect(update).toBeDefined();
    expect(update.latestChapterId).toBe("alt-ch-55");
    expect(update.latestChapterNumber).toBe(55);
    expect(update.detectedSourceId).toBe("healthy-alt");
    expect(update.detectedMangaId).toBe("alt-manga-2");
    expect(update.isAlternateSource).toBe(true);
  });

  it("3. alternate update check DOES NOT permanently relink the library title", async () => {
    useLibraryStore.setState({
      items: {
        "title-3": {
          id: "title-3",
          sourceId: "primary-source",
          mangaId: "slug-orig",
          title: "Tower of God",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "alternate-source",
              mangaId: "slug-alt",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "alt-ch-1", number: 1, title: "Chapter 1" },
    ]);

    await scanLibraryUpdates({ forceRefresh: true });

    // Verify invariant: Library item primary source is UNTOUCHED
    const libItem = useLibraryStore.getState().items["title-3"];
    expect(libItem.sourceId).toBe("primary-source");
    expect(libItem.mangaId).toBe("slug-orig");
  });

  it("4. deduplicates identical logical chapter from two sources", async () => {
    useLibraryStore.setState({
      items: {
        "title-4": {
          id: "title-4",
          sourceId: "src-1",
          mangaId: "m-1",
          title: "Return of the Mount Hua Sect",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "src-2",
              mangaId: "m-2",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // Both sources report Chapter 80
    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "src-1") {
        return Promise.resolve([
          { id: "src1-ch80", number: 80, title: "Chapter 80" },
        ]);
      }
      if (sourceId === "src-2") {
        return Promise.resolve([
          { id: "src2-ch80", mangaId:"m-2",isLocked:false,number: 80, title: "Ch. 80" },
        ]);
      }
      return Promise.resolve([]);
    });

    await scanLibraryUpdates({ forceRefresh: true });

    // Only one update record exists for the title
    const updates = Object.values(useUpdateStore.getState().items);
    const titleUpdates = updates.filter((u) => u.savedTitleId === "title-4");
    expect(titleUpdates.length).toBe(1);
    expect(titleUpdates[0].latestChapterNumber).toBe(80);
    // Prefers primary source if numbers are identical
    expect(titleUpdates[0].detectedSourceId).toBe("src-1");
  });

  it("does not emit a duplicate notification when another source releases the same numbered chapter", async () => {
    useLibraryStore.setState({items:{"dedupe":{id:"dedupe",sourceId:"src-1",mangaId:"m-1",title:"Fixture",addedAt:"2026-01-01",updatedAt:"2026-01-01",
      linkedSources:[{sourceId:"src-2",mangaId:"m-2",matchConfidence:"CONFIRMED",addedAt:Date.now()}]}}});
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="src-1"?
      [{id:"first-80",mangaId:"m-1",title:"Chapter 80",number:80,date:""}]:[]);
    await scanLibraryUpdates({forceRefresh:true});
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="src-2"?
      [{id:"alternate-81",mangaId:"m-2",isLocked:false,title:"Chapter 81",number:81,date:""}]:[]);
    expect((await scanLibraryUpdates({forceRefresh:true})).updatesDetected).toBe(1);
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="src-1"?
      [{id:"first-81",mangaId:"m-1",title:"Chapter 81",number:81,date:""}]:[]);
    expect((await scanLibraryUpdates({forceRefresh:true})).updatesDetected).toBe(0);
    expect(useUpdateStore.getState().items.dedupe.latestChapterId).toBe("alternate-81");
    expect(useUpdateStore.getState().items.dedupe.seenAt).toBeUndefined();
  });
  it("5. normalizes decimal/part chapters accurately (e.g. 105.5)", async () => {
    useLibraryStore.setState({
      items: {
        "title-5": {
          id: "title-5",
          sourceId: "src-decimal",
          mangaId: "m-decimal",
          title: "Decimal Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });

    (apiClient.getChapters as any).mockResolvedValue([
      { id: "ch-105-5", number: 0, title: "Chapter 105.5 Special Edition" },
      { id: "ch-105", number: 105, title: "Chapter 105" },
    ]);

    await scanLibraryUpdates({ forceRefresh: true });

    const update = useUpdateStore.getState().items["title-5"];
    expect(update.latestChapterNumber).toBe(105.5);
    expect(update.latestChapterId).toBe("ch-105-5");
  });

  it("6. honors explicit per-title preference over default primary", async () => {
    useLibraryStore.setState({
      items: {
        "title-6": {
          id: "title-6",
          sourceId: "source-default",
          mangaId: "manga-default",
          title: "Pref Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "source-preferred",
              mangaId: "manga-preferred",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // User explicitly chose source-preferred
    useSettingsStore.setState({
      perTitleSourcePreferences: {
        "title-6": "source-preferred",
      },
    });

    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "source-preferred") {
        return Promise.resolve([
          { id: "pref-ch-200",mangaId:"manga-preferred",isLocked:false,number: 200, title: "Chapter 200" },
        ]);
      }
      return Promise.resolve([
        { id: "def-ch-190", number: 190, title: "Chapter 190" },
      ]);
    });

    await scanLibraryUpdates({ forceRefresh: true });

    const update = useUpdateStore.getState().items["title-6"];
    expect(update.detectedSourceId).toBe("source-preferred");
    expect(update.latestChapterNumber).toBe(200);
  });

  it("polls the relinked primary and a preferred alias without rewriting the notification identity", async () => {
    useLibraryStore.setState({ items: { survivor: {
      id: "survivor", sourceId: "original", mangaId: "original-edition", title: "Fixture", coverUrl: "/fixture.png",
      addedAt: "2026-01-01", updatedAt: "2026-01-01", savedTitleAliases: ["retired"],
      primarySourceId: "current", primaryMangaId: "current-edition",
      linkedSources: [{ sourceId: "preferred", mangaId: "preferred-edition", matchConfidence: "CONFIRMED", addedAt: 0 }],
    } } });
    useSettingsStore.setState({ perTitleSourcePreferences: { retired: "preferred" } });
    vi.mocked(apiClient.getChapters).mockImplementation(async (sourceId, mangaId) => [
      { id: `${sourceId}-12`, mangaId, number: 12, title: "Chapter 12", date: "", isLocked: false },
    ]);

    await scanLibraryUpdates({ forceRefresh: true });

    expect(vi.mocked(apiClient.getChapters).mock.calls.map(([sourceId, mangaId]) => [sourceId, mangaId]))
      .toEqual([["preferred", "preferred-edition"], ["current", "current-edition"]]);
    expect(useUpdateStore.getState().items.survivor).toEqual(expect.objectContaining({
      sourceId: "original", mangaId: "original-edition", detectedSourceId: "preferred", detectedMangaId: "preferred-edition",
    }));
  });

  it("7. deprioritizes known degraded/offline sources", async () => {
    useLibraryStore.setState({
      items: {
        "title-7": {
          id: "title-7",
          sourceId: "broken-primary",
          mangaId: "manga-7",
          title: "Health Aware Manga",
          addedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          linkedSources: [
            {
              sourceId: "healthy-alt",
              mangaId: "manga-7-alt",
              matchConfidence: "CONFIRMED",
              addedAt: Date.now(),
            },
          ],
        },
      },
    });

    // broken-primary marked offline in health store
    useSourceHealthStore.setState({
      healthBySource: {
        "broken-primary": {
          status: "offline",
          latencyMs: 10000,
          lastSuccessAt: 0,
          consecutiveFailures: 5,
        },
      },
    });

    (apiClient.getChapters as any).mockImplementation((sourceId: string) => {
      if (sourceId === "healthy-alt") {
        return Promise.resolve([
          { id: "healthy-ch-1",mangaId:"manga-7-alt",isLocked:false,number: 1, title: "Chapter 1" },
        ]);
      }
      return Promise.reject(new Error("Down"));
    });

    const res = await scanLibraryUpdates({ forceRefresh: true });
    expect(res.totalScanned).toBe(1);
    expect(res.errors.length).toBe(0);

    const update = useUpdateStore.getState().items["title-7"];
    expect(update.detectedSourceId).toBe("healthy-alt");
    expect(update.latestChapterNumber).toBe(1);
  });
});

describe("cross-source notification boundaries",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();useLibraryStore.setState({items:{fixture:{id:"fixture",sourceId:"primary",mangaId:"work",title:"Fixture",coverUrl:"/cover.jpg",addedAt:"2026-01-01",updatedAt:"2026-01-01",linkedSources:[{sourceId:"alternate",mangaId:"alt-work",matchConfidence:"CONFIRMED",addedAt:1}]}}});
    useUpdateStore.setState({items:{}});useSettingsStore.setState({perTitleSourcePreferences:{}});useSourceHealthStore.setState({healthBySource:{}});
  });
  it("never polls competing editions on one alternate provider",async()=>{
    const item=useLibraryStore.getState().items.fixture;
    useLibraryStore.setState({items:{fixture:{...item,linkedSources:[
      ...(item.linkedSources??[]),
      {sourceId:"alternate",mangaId:"different-edition",matchConfidence:"CONFIRMED",addedAt:1},
      {sourceId:"primary",mangaId:"wrong-primary",matchConfidence:"CONFIRMED",addedAt:1}
    ]}}});
    vi.mocked(apiClient.getChapters).mockResolvedValue([{id:"p1",mangaId:"work",title:"Chapter 1",number:1,date:"",isLocked:false}]);
    await scanLibraryUpdates({forceRefresh:true});
    expect(apiClient.getChapters).toHaveBeenCalledTimes(1);
    expect(apiClient.getChapters).toHaveBeenCalledWith("primary","work",expect.anything());
    expect(useUpdateStore.getState().items.fixture.latestChapterId).toBe("p1");
  });
  it("does not write a cursor after an aborted poll",async()=>{
    const controller=new AbortController();
    vi.mocked(apiClient.getChapters).mockImplementation(async()=>{
      controller.abort();
      return [{id:"p1",mangaId:"work",title:"Chapter 1",number:1,date:"",isLocked:false}];
    });
    await scanLibraryUpdates({forceRefresh:true,signal:controller.signal});
    expect(useUpdateStore.getState().items).toEqual({});
  });
  it("rejects alternate chapters with missing parent or unlock evidence",async()=>{
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="primary"?
      [{id:"p10",mangaId:"work",title:"Chapter 10",number:10,date:"",isLocked:false}]:
      [{id:"bad1",mangaId:"alt-work",title:"Chapter 99",number:99,date:""},
       {id:"bad2",mangaId:"",title:"Chapter 100",number:100,date:"",isLocked:false},
       {id:"bad3",mangaId:"other",title:"Chapter 101",number:101,date:"",isLocked:false}]);
    await scanLibraryUpdates({forceRefresh:true});
    expect(useUpdateStore.getState().items.fixture.latestChapterId).toBe("p10");
  });
  it("backfills legacy volume only from the exact saved cursor",async()=>{
    useUpdateStore.getState().upsertUpdate({savedTitleId:"fixture",sourceId:"primary",mangaId:"work",mangaTitle:"Fixture",latestChapterId:"p20",latestChapterNumber:20,latestChapterTitle:"Chapter 20",detectedSourceId:"primary",seenAt:"2026-01-01"});
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="primary"?
      [{id:"p20",mangaId:"work",title:"Chapter 20",chapterNumber:"20",volume:"1",number:20,date:"",isLocked:false},
       {id:"p21",mangaId:"work",title:"Chapter 1",chapterNumber:"1",volume:"2",number:1,date:"",isLocked:false}]:[]);
    expect((await scanLibraryUpdates({forceRefresh:true})).updatesDetected).toBe(1);
    expect(useUpdateStore.getState().items.fixture).toMatchObject({latestChapterId:"p21",latestChapterVolume:2,latestChapterNumber:1});
  });
  it("supports explicitly numbered volumes, ignores incomparable global numbers and retains unread state across empty scans",async()=>{
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="primary"?
      [{id:"p20",mangaId:"work",title:"Vol. 1 Chapter 20",number:20,date:"",isLocked:false}]:[]);
    await scanLibraryUpdates({forceRefresh:true});
    vi.mocked(apiClient.getChapters).mockImplementation(async sourceId=>sourceId==="alternate"?
      [{id:"a1",mangaId:"alt-work",title:"Vol. 2 Chapter 1",number:1,date:"",isLocked:false},
       {id:"global",mangaId:"alt-work",title:"Chapter 999",number:999,date:"",isLocked:false}]:[]);
    expect((await scanLibraryUpdates({forceRefresh:true})).updatesDetected).toBe(1);
    const old=useUpdateStore.getState().items.fixture;
    expect(old).toMatchObject({latestChapterId:"a1",latestChapterVolume:2,latestChapterNumber:1});
    vi.mocked(apiClient.getChapters).mockResolvedValue([]);
    expect((await scanLibraryUpdates({forceRefresh:true})).updatesDetected).toBe(0);
    expect(useUpdateStore.getState().items.fixture).toMatchObject({latestChapterId:"a1",detectedAt:old.detectedAt});
    expect(useUpdateStore.getState().items.fixture.seenAt).toBeUndefined();
  });
});
