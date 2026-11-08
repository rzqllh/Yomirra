import { afterEach, expect, it, vi } from "vitest";
import { saveAs } from "file-saver";
import { downloadChapterAsZip } from "../zip-downloader";

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));
vi.mock("@/shared/api-client", () => ({
  apiClient: {
    pagesQuery: () => ({
      queryFn: async () => ({
        pages: Array.from({ length: 5 }, (_, index) => ({ index, url: `/image/${index}` })),
      }),
    }),
  },
}));

afterEach(() => vi.unstubAllGlobals());

it("cancels sibling fetches and leaves queued pages untouched on failure", async () => {
  const aborted: string[] = [];
  const fetchImage = vi.fn(async (url: string, options: RequestInit) => {
    if (url === "/image/0") return new Response(null, { status: 429 });
    return new Promise<Response>((_, reject) => {
      options.signal?.addEventListener("abort", () => {
        aborted.push(url);
        reject(options.signal?.reason);
      }, { once: true });
    });
  });
  vi.stubGlobal("fetch", fetchImage);
  await expect(downloadChapterAsZip({
    sourceId: "source", mangaId: "manga", chapterId: "chapter",
    chapterTitle: "Chapter", mangaTitle: "Manga",
  })).rejects.toThrow("Gagal mengunduh halaman 1");

  expect(fetchImage).toHaveBeenCalledTimes(3);
  expect(aborted).toEqual(["/image/1", "/image/2"]);
  expect(saveAs).not.toHaveBeenCalled();
});
