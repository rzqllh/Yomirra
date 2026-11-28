import { describe, expect, it, vi } from "vitest";
import { normalizeStagedPages } from "../normalize-catalog";
import { MangaThemesiaEngine } from "../mangathemesia";
import { HttpClient } from "../../base/http-client";

describe("staged page reference normalization", () => {
  const base = "https://example.test";
  it("resolves relative references against the chapter path and retains order", () => {
    const result = normalizeStagedPages("chapter", [
      { index: 0, url: "page-1.jpg" },
      { index: 4, url: "/media/page-2.jpg" },
      { index: 4, url: "https://cdn.example.test/page-3.jpg" },
    ], "/read/chapter/", base, "fixture");
    expect(result.pages.map(p => [p.index,p.url])).toEqual([
      [1,base+"/read/chapter/page-1.jpg"],
      [2,base+"/media/page-2.jpg"],
      [3,"https://cdn.example.test/page-3.jpg"],
    ]);
  });
  it("does not return partial successful results for invalid or empty lists", () => {
    for (const url of ["http://example.test/a", "javascript:alert(1)", "https://user@example.test/a", "data:image/png;base64,a", "https://example.test:123/a"]) {
      expect(() => normalizeStagedPages("chapter", [{index:1,url:"/ok.jpg"},{index:2,url}], "/chapter/", base, "fixture")).toThrow();
    }
    expect(() => normalizeStagedPages("chapter", [], "/chapter/", base, "fixture")).toThrow();
  });
  it("does not disguise a malformed structured reader response with HTML fallback", async () => {
    const engine = new MangaThemesiaEngine({ id:"fixture", name:"Fixture", baseUrl:base, category:"SFW", isNsfw:false });
    const get = vi.spyOn(HttpClient.prototype,"getHtml").mockResolvedValue(
      '<script>ts_reader.run({"sources":[{"images":["/valid.jpg","javascript:alert(1)"]}]});</script><div id="readerarea"><img src="/fallback.jpg"></div>'
    );
    try {
      await expect(engine.getPages("chapter")).rejects.toMatchObject({code:"SCHEMA_CHANGED"});
      get.mockResolvedValueOnce("<html><body>Unexpected response</body></html>");
      await expect(engine.getPages("chapter")).rejects.toMatchObject({code:"PARSER_BROKEN"});
    } finally { get.mockRestore(); }
  });
});
