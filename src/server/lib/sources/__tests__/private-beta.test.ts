import { afterEach, describe, expect, it, vi } from "vitest";
import { privateBetaSources, privateBetaAllowsSource, readPrivateBetaCatalog } from "../private-beta";
import { getStagedKeiyoushiSource } from "../adapters/keiyoushi";

vi.mock("../adapters/keiyoushi", () => ({getStagedKeiyoushiSource:vi.fn()}));
afterEach(() => {vi.unstubAllEnvs(); vi.clearAllMocks();});
describe("private beta scope", () => {
  it("defaults to no permitted live sources and excludes restricted/duplicate/prototype identities", () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    expect(privateBetaSources().every(s => !s.available)).toBe(true);
    expect(privateBetaSources("manhwa-list,kiryuu,komikindoid,manga-plus-by-shueisha,webcomics").filter(s => s.available).map(s => s.id)).toEqual(["manhwa-list"]);
  });
  it("cannot invoke an adapter without explicit permission", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    await expect(readPrivateBetaCatalog("manhwa-list","")).rejects.toThrow("PRIVATE_BETA_SOURCE_UNAVAILABLE");
    expect(getStagedKeiyoushiSource).not.toHaveBeenCalled();
  });
  it("returns only safe bounded metadata and never changes adapter enablement", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter = {id:"manhwa-list",isEnabled:false,isNsfw:false,getPopular:vi.fn().mockResolvedValue({mangas:[
      {id:"safe",title:"Safe title",contentRating:"safe",coverUrl:"https://example.test/cover"},
      {id:"unknown",title:"Unknown rating"}, {id:"restricted",title:"Restricted",contentRating:"erotica"}
    ]}),getPages:vi.fn()};
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    expect(privateBetaAllowsSource("manhwa-list")).toBe(true);
    expect(await readPrivateBetaCatalog("manhwa-list","")).toEqual({items:[{id:"safe",title:"Safe title",format:undefined}],received:3});
    expect(adapter.getPages).not.toHaveBeenCalled();
    expect(adapter.isEnabled).toBe(false);
  });
});
