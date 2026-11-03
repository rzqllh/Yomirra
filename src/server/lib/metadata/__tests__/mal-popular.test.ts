import { describe, expect, it, vi, afterEach } from "vitest";
import { getMalPopular, normalizeMalRanking } from "../mal-popular";
vi.mock("@/server/lib/cache/redis-cache", () => ({ withCache: (_key: string, fetcher: () => unknown) => fetcher() }));
const entry = (id: number, rank: number, nsfw?: string) => ({ node: { id, title: `Work ${id}`, nsfw, media_type: "manga", main_picture: { large: "https://cdn.myanimelist.net/test.jpg" }, num_list_users: 100 }, ranking: { rank } });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("MAL external ranking", () => {
  it("keeps original popularity positions and fails closed on unknown classification", () => {
    expect(normalizeMalRanking([entry(1, 1, "black"), entry(2, 2), entry(3, 3, "white"), entry(3, 3, "white")], true).map(x => [x.malId, x.rank])).toEqual([[3, 3]]);
  });
  it("retains classification in opt-in payloads for immediate client opt-out", () => {
    expect(normalizeMalRanking([entry(1, 1, "black")], false)[0].nsfw).toBe("black");
  });
  it("reports missing configuration without contacting MAL", async () => {
    vi.stubEnv("MAL_CLIENT_ID", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await getMalPopular()).status).toBe("unconfigured"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("requests popularity with a server header and explicit classification fields", async () => {
    vi.stubEnv("MAL_CLIENT_ID", "test-only-client-id"); const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [entry(3, 3, "white")] }), { headers: { "date": "Sat, 31 Oct 2026 00:00:00 GMT" } })); vi.stubGlobal("fetch", fetcher);
    const result = await getMalPopular(); expect(result.status).toBe("ready");
    const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get("ranking_type")).toBe("bypopularity");
    expect(url).not.toContain("test-only-client-id"); expect(options.headers).toMatchObject({ "X-MAL-CLIENT-ID": "test-only-client-id" });
  });
  it("reports provider failure without manufacturing empty ranking", async () => {
    vi.stubEnv("MAL_CLIENT_ID", "test-only-client-id"); vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status: 429 })));
    expect((await getMalPopular()).status).toBe("unavailable");
  });
});
