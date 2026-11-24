import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMangaUpdatesReference, parseMangaUpdatesReference } from "../manga-updates";
import { mangaUpdatesNumericId, mangaUpdatesReferenceHref } from "@/shared/lib/manga-updates-reference";
import type { MangaDetail } from "@/shared/types/source";
import {reserveOptionalService} from "@/server/lib/cache/optional-service-budget";
vi.mock("@/server/lib/cache/optional-service-budget",()=>({reserveOptionalService:vi.fn().mockResolvedValue(true)}));

vi.mock("@/server/lib/cache/redis-cache", () => ({
  withCache: async (_key: string, load: () => Promise<unknown>) => load(),
}));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const id = "abc123";
const series = { series_id: parseInt(id, 36), title: "Fixture title", type: "Manga",
  url: "https://www.mangaupdates.com/series/" + id + "/fixture" };
const detail: MangaDetail = { id: "fixture", title: "Fixture title", coverUrl: "", description: "",
  genres: [], status: "ONGOING", format: "manga", contentRating: "safe", externalWorkIds: { manga_updates: id } };

describe("MangaUpdates reference boundary", () => {
  it("accepts only safe numeric conversions and fixed public reference URLs", () => {
    expect(mangaUpdatesNumericId(id)).toBe(series.series_id);
    expect(mangaUpdatesReferenceHref(id)).toBe("https://www.mangaupdates.com/series/" + id);
    for (const bad of ["1234", "0abc", "https://other.test", "zzzzzzzzzzzzz", "abc/123"]) {
      expect(mangaUpdatesNumericId(bad)).toBeNull();
    }
  });
  it("rejects mismatched identity, unsafe links and incompatible media", () => {
    expect(parseMangaUpdatesReference(series, id)).toEqual({ id, title: "Fixture title", format: "manga" });
    for (const bad of [{...series, series_id: 1}, {...series, url: "https://other.test/series/" + id}, {...series, type: "Novel"}]) {
      expect(parseMangaUpdatesReference(bad, id)).toBeNull();
    }
  });
  it("uses only configured, safe MangaDex detail references", async () => {
    const get = vi.fn(); vi.stubGlobal("fetch", get);
    vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA", "");
    expect(await loadMangaUpdatesReference("mangadex", detail)).toBeNull();
    vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA", "permitted");
    expect(await loadMangaUpdatesReference("other", detail)).toBeNull();
    expect(await loadMangaUpdatesReference("mangadex", {...detail, contentRating: "unknown"})).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
  it("looks up an exact existing ID, requires title and type agreement, and throttles repeated requests", async () => {
    vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA", "permitted");
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-24T00:00:00Z"));
    const get = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(series)))
      .mockResolvedValueOnce(new Response(JSON.stringify(series)));
    vi.stubGlobal("fetch", get);
    expect(await loadMangaUpdatesReference("mangadex", detail)).toEqual({ id, title: "Fixture title", format: "manga" });
    expect(get).toHaveBeenCalledWith("https://api.mangaupdates.com/v1/series/" + series.series_id, expect.objectContaining({redirect:"error"}));
    expect(await loadMangaUpdatesReference("mangadex", detail)).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-11-24T00:00:02Z"));
    expect(await loadMangaUpdatesReference("mangadex", {...detail, title:"Different work"})).toBeNull();
    expect(get).toHaveBeenCalledTimes(2);
  });
});

it("does not contact MangaUpdates when shared admission is denied",async()=>{
  vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA","permitted");
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-25T00:00:00Z"));
  const get=vi.fn();vi.stubGlobal("fetch",get);
  vi.mocked(reserveOptionalService).mockResolvedValueOnce(false);
  expect(await loadMangaUpdatesReference("mangadex",detail)).toBeNull();
  expect(reserveOptionalService).toHaveBeenCalledWith("mangaupdates");
  expect(get).not.toHaveBeenCalled();
});
