import { describe, expect, it } from "vitest";
import {
  parseCatalogPage,
  writeCatalogPageParam,
} from "../use-url-pagination";

describe("URL pagination restoration", () => {
  it("parses only positive page numbers", () => {
    expect(parseCatalogPage("3")).toBe(3);
    expect(parseCatalogPage("0")).toBe(1);
    expect(parseCatalogPage("-4")).toBe(1);
    expect(parseCatalogPage("abc")).toBe(1);
  });

  it("writes page context without disturbing filters", () => {
    expect(writeCatalogPageParam("source=a&genre=action", 4)).toBe(
      "source=a&genre=action&page=4"
    );
  });

  it("removes the page parameter for page one", () => {
    expect(writeCatalogPageParam("q=test&page=7", 1)).toBe("q=test");
  });
});
