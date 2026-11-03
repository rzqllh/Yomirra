import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  parseCatalogPage,
  writeCatalogPageParam,
  useUrlPagination,
} from "../use-url-pagination";

const navigation = vi.hoisted(() => ({
  params: "source=mangadex&sort=latest&page=3",
  router: { replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
  useSearchParams: () => new URLSearchParams(navigation.params),
  useRouter: () => navigation.router,
}));

describe("URL pagination restoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = "source=mangadex&sort=latest&page=3";
  });

  it("does not replay stale query params when a page reset repeats during navigation", () => {
    const { result, rerender } = renderHook(() => useUrlPagination());
    act(() => result.current[1](1));
    expect(result.current[0]).toBe(1);
    navigation.router.replace.mockClear();
    // The router still exposes the old URL until its newer sort navigation commits.
    rerender();
    act(() => result.current[1](1));
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
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
