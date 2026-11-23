import { describe, expect, it, vi } from "vitest";
import { KeiyoushiHtmlAdapter, extractTsReaderImages } from "../html-adapter";
import type { HttpClient } from "../../base/http-client";
import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";

const candidate = KEIYOUSHI_CANDIDATES.find(({ id }) => id === "manhwa-list")!;
const listing = [
  '<div class="bsx"><a href="https://m1.manhwalist.my.id/manga/example/" title="Example">',
  '<img data-src="https://cdn.example.net/cover.webp"></a><h3>Example</h3></div>',
  '<a class="next page-numbers" href="/page/2/">Next</a>',
].join("");
const detail = [
  '<h1 class="entry-title">Example</h1>',
  '<div class="summary__content">A description.</div>',
  '<div class="thumb"><img src="https://cdn.example.net/cover.webp"></div>',
  '<div class="mgen"><a href="/genres/action/">Action</a></div>',
  '<ul id="chapterlist"><li><a href="https://m1.manhwalist.my.id/manga/example/chapter-1/">',
  '<span class="chapternum">Chapter 1</span></a></li></ul>',
].join("");

function makeAdapter(responder: (path: string) => string) {
  const getHtml = vi.fn(async (path: string) => responder(path));
  const client = { getHtml } as unknown as HttpClient;
  return { adapter: new KeiyoushiHtmlAdapter(candidate, client), getHtml };
}

describe("Keiyoushi experimental HTML bridge", () => {
  it("parses a catalog into the Yomirra contract without using raw fetch", async () => {
    const { adapter, getHtml } = makeAdapter(() => listing);
    const result = await adapter.getPopular(1);
    expect(result.hasNextPage).toBe(true);
    expect(result.mangas).toEqual([expect.objectContaining({
      id: "/manga/example/", title: "Example",
      coverUrl: "https://cdn.example.net/cover.webp",
    })]);
    expect(getHtml).toHaveBeenCalledWith("/manga/?order=popular&page=1");
    expect(adapter.isEnabled).toBe(false);
    expect(adapter.status).toBe("in-dev");
  });

  it("reads detail, chapter IDs and zero-based reader pages", async () => {
    const { adapter } = makeAdapter((path) => path.includes("chapter-1")
      ? '<div id="readerarea"><img data-src="https://cdn.example.net/1.webp"><img src="https://cdn.example.net/2.webp"></div>'
      : detail
    );
    expect(await adapter.getDetail("/manga/example/")).toEqual(expect.objectContaining({
      title: "Example", genres: ["Action"], status: "UNKNOWN",
    }));
    const chapters = await adapter.getChapters("/manga/example/");
    expect(chapters).toEqual([expect.objectContaining({
      id: "/manga/example/chapter-1/", number: 1, mangaId: "/manga/example/",
    })]);
    const pages = await adapter.getPages(chapters[0].id);
    expect(pages.pages).toEqual([
      { index: 0, url: "https://cdn.example.net/1.webp", referer: candidate.baseUrl + "/" },
      { index: 1, url: "https://cdn.example.net/2.webp", referer: candidate.baseUrl + "/" },
    ]);
  });

  it("rejects off-origin detail and chapter URL inputs before HTTP I/O", async () => {
    const { adapter, getHtml } = makeAdapter(() => "");
    await expect(adapter.getDetail("https://evil.example/manga/demo")).rejects.toThrow();
    await expect(adapter.getPages("https://evil.example/private")).rejects.toThrow();
    await expect(adapter.getPages("//evil.example/page")).rejects.toThrow();
    expect(getHtml).not.toHaveBeenCalled();
  });

  it("parses nested JSON reader payloads without evaluating scripts", () => {
    const html = '<script>ts_reader.run({"sources":[{"images":["https://cdn.example.net/a.webp","https://cdn.example.net/b.webp"],"nested":{"x":1}}]});</script>';
    expect(extractTsReaderImages(html)).toEqual([
      "https://cdn.example.net/a.webp", "https://cdn.example.net/b.webp",
    ]);
    expect(extractTsReaderImages('<script>ts_reader.run({invalid:()=>{}})</script>')).toEqual([]);
  });

  it("denies mixed content by default and never silently enables a staged adapter", () => {
    const mixed = KEIYOUSHI_CANDIDATES.find(({ id }) => id === "kiryuu")!;
    const adapter = new KeiyoushiHtmlAdapter(mixed, { getHtml: vi.fn() } as unknown as HttpClient);
    expect(adapter.isNsfw).toBe(true);
    expect(adapter.isEnabled).toBe(false);
    expect(adapter.status).toBe("in-dev");
  });
});
