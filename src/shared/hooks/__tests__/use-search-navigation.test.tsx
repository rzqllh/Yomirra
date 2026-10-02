import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useSearchCatalog } from "../use-search-catalog";
import { apiClient } from "@/shared/api-client";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";

const navigation = vi.hoisted(() => ({
  params: "q=solo+leveling&keep=1",
  router: { push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.params),
  useRouter: () => navigation.router,
}));
vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getSources: vi.fn(async () => []),
    getFilters: vi.fn(async () => ({ genres: [], formats: [], statuses: [], sorts: [] })),
    getPopular: vi.fn(async () => ({ mangas: [], hasNextPage: false })),
    getLatest: vi.fn(async () => ({ mangas: [], hasNextPage: false })),
    search: vi.fn(async () => ({ results: [], hasNextPage: false })),
    rankSearchIntelligence: vi.fn(async () => ({ scores: {}, catalogMatches: [] })),
  },
}));
vi.mock("@/shared/sources/dynamic-source-registry", () => ({
  dynamicSourceRegistry: { getAll: () => [] },
}));

let client: QueryClient;
function mountSearch() {
  return renderHook(() => useSearchCatalog(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("search URL navigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    navigation.params = "q=solo+leveling&keep=1";
    useSearchFilterStore.setState({ genres: [], formats: [], status: "", sort: "popular", selectedSources: null, hasCustomizedSources: false });
    client = new QueryClient({
      defaultOptions: { queries: {
        retry: false, staleTime: 900_000,
        refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
      } },
    });
    vi.mocked(apiClient.getSources).mockResolvedValue([]);
  });
  afterEach(() => {
    client.clear();
    focusManager.setFocused(undefined);
    vi.useRealTimers();
  });

  it("keeps an immediate submit instead of restoring the old debounced query", async () => {
    const { result, rerender } = mountSearch();
    act(() => result.current.setLocalQuery("naruto"));
    act(() => result.current.handleSearchSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent));
    expect(navigation.router.push).toHaveBeenCalledWith("/search?q=naruto&keep=1");
    navigation.params = "q=naruto&keep=1";
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    expect(navigation.router.push).toHaveBeenCalledTimes(1);
    expect(result.current.localQuery).toBe("naruto");
  });

  it("uses Back/Forward URL values and cancels an unfinished edit", async () => {
    const { result, rerender } = mountSearch();
    act(() => result.current.setLocalQuery("unfinished"));
    navigation.params = "q=bleach&keep=1";
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    expect(result.current.localQuery).toBe("bleach");
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it("debounces the latest edit once and preserves other parameters", async () => {
    const { result, rerender } = mountSearch();
    act(() => result.current.setLocalQuery("naru"));
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    act(() => result.current.setLocalQuery("naruto  "));
    await act(async () => { await vi.advanceTimersByTimeAsync(799); });
    expect(navigation.router.push).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(navigation.router.push).toHaveBeenCalledExactlyOnceWith("/search?q=naruto&keep=1");
    navigation.params = "q=naruto&keep=1";
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    expect(navigation.router.push).toHaveBeenCalledTimes(1);
  });

  it("clears the query without restoring the previous search", async () => {
    const { result, rerender } = mountSearch();
    act(() => result.current.setLocalQuery(""));
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(navigation.router.push).toHaveBeenCalledExactlyOnceWith("/search?keep=1");
    navigation.params = "keep=1";
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    expect(result.current.localQuery).toBe("");
    expect(navigation.router.push).toHaveBeenCalledTimes(1);
  });

  it("cancels delayed navigation on unmount", async () => {
    const { result, unmount } = mountSearch();
    act(() => result.current.setLocalQuery("naruto"));
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it("refreshes cached source metadata on mount and when the PWA returns to focus", async () => {
    client.setQueryData(["sources"], []);
    mountSearch();
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(apiClient.getSources).toHaveBeenCalledTimes(1);
    act(() => focusManager.setFocused(false));
    act(() => focusManager.setFocused(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(apiClient.getSources).toHaveBeenCalledTimes(2);
  });

  it("loads the default popular catalog when the query is empty", async () => {
    navigation.params = "";
    vi.mocked(apiClient.getSources).mockResolvedValue([
      {
        id: "source-a",
        name: "Source A",
        isEnabled: true,
        isInstalled: true,
        isNsfw: false,
        status: "online",
        capabilities: { search: true, popular: true, latest: true, filters: true },
      } as any,
    ]);
    vi.mocked(apiClient.getPopular).mockResolvedValue({
      mangas: [{ id: "m1", title: "Popular One", coverUrl: "/popular.jpg" }],
      hasNextPage: false,
    });

    const { result } = mountSearch();
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });

    expect(apiClient.getPopular).toHaveBeenCalledWith("source-a", 1);
    expect(apiClient.search).not.toHaveBeenCalled();
    expect(result.current.hasSearchIntent).toBe(true);
    expect(result.current.searchMangas.map((item) => item.manga.title)).toEqual([
      "Popular One",
    ]);
  });

  it("uses the latest feed for an empty-query latest sort", async () => {
    navigation.params = "";
    useSearchFilterStore.setState({
      genres: [],
      formats: [],
      status: "",
      sort: "latest",
      selectedSources: null,
      hasCustomizedSources: false,
    });
    vi.mocked(apiClient.getSources).mockResolvedValue([
      {
        id: "source-a",
        name: "Source A",
        isEnabled: true,
        isInstalled: true,
        isNsfw: false,
        status: "online",
        capabilities: { search: true, popular: true, latest: true, filters: true },
      } as any,
    ]);
    vi.mocked(apiClient.getFilters).mockResolvedValue({
      genres: [],
      formats: [],
      statuses: [],
      sorts: [
        { id: "popular", name: "Populer" },
        { id: "latest", name: "Terbaru" },
      ],
    });
    vi.mocked(apiClient.getLatest).mockResolvedValue({
      mangas: [{ id: "m2", title: "Latest One", coverUrl: "/latest.jpg" }],
      hasNextPage: false,
    });

    const { result } = mountSearch();
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });

    expect(apiClient.getLatest).toHaveBeenCalledWith("source-a", 1);
    expect(apiClient.search).not.toHaveBeenCalled();
    expect(result.current.searchMangas.map((item) => item.manga.title)).toEqual([
      "Latest One",
    ]);
  });
});
