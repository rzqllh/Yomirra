import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandMenu, canRevealQuickSearchCover } from "../command-menu";
import { apiClient } from "@/shared/api-client";
import { useDiscoveryScopeStore } from "@/shared/store/discovery-scope-store";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import type { GlobalSearchResponse, } from "@/shared/types/search";
import type { SourceMetadata } from "@/shared/sources/source-types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/search" }));
const sources: SourceMetadata[] = ["a", "b"].map((id) => ({ id, name: `Source ${id}`, isEnabled: true, isInstalled: true, isNsfw: false, isDynamic: false,
  capabilities: { search: true, popular: true, latest: true, detail: true, chapters: true, pages: true, filters: false } }));
const response = (id: string): GlobalSearchResponse => ({ resultsBySource: { [id]: { results: [{ id: `work-${id}`, title: `Work ${id}`, coverUrl: "" }] } } });
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.restoreAllMocks(); push.mockClear();
  useSettingsStore.setState({ hideNsfw: true });
  useSourcePreferencesStore.setState({ disabledSources: [] });
  useDiscoveryScopeStore.setState({ sourceId: "a" });
  useSearchFilterStore.setState({ selectedSources: ["b"], hasCustomizedSources: true });
  vi.spyOn(apiClient, "getSources").mockResolvedValue(sources);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals(); });

function open() {
  render(<QueryClientProvider client={client}><button>Trigger</button><CommandMenu /></QueryClientProvider>);
  const trigger = screen.getByRole("button", { name: "Trigger" }); trigger.focus();
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  return trigger;
}

describe("Quick Search scope and dialog", () => {
  it("does not infer safety from absent or unknown rating", () => {
    expect(canRevealQuickSearchCover({}, true)).toBe(false);
    expect(canRevealQuickSearchCover({ contentRating: "unknown" }, true)).toBe(false);
    expect(canRevealQuickSearchCover({ contentRating: "erotica" }, true)).toBe(false);
    expect(canRevealQuickSearchCover({ contentRating: "safe", isNsfw: true }, true)).toBe(false);
    expect(canRevealQuickSearchCover({ contentRating: "safe" }, true)).toBe(true);
    expect(canRevealQuickSearchCover({ contentRating: "unknown" }, false)).toBe(true);
  });

  it("renders an unverified warning instead of fetching an UNKNOWN thumbnail", async () => {
    vi.spyOn(apiClient, "searchGlobal").mockResolvedValue({
      resultsBySource: {
        a: { results: [{
          id: "unverified-title",
          title: "Unverified title",
          coverUrl: "https://example.com/unverified.jpg",
          contentRating: "unknown",
        }] },
      },
    });
    open();
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "unverified" } });
    await screen.findByText("Unverified title");
    expect(screen.getByText("Rating belum terverifikasi")).toBeTruthy();
    expect(document.querySelector('img[src*="unverified.jpg"]')).toBeNull();
    expect(screen.getByRole("option", { name: /Unverified title/ })).toBeTruthy();
  });

  it("opens on Cari but searches Jelajah's source without overwriting Cari selection", async () => {
    const search = vi.spyOn(apiClient, "searchGlobal").mockResolvedValue(response("a"));
    open();
    const input = await screen.findByRole("combobox", { name: "Quick Search di sumber Jelajah" });
    fireEvent.change(input, { target: { value: "work" } });
    await screen.findByText("Work a");
    expect(search).toHaveBeenCalledWith("work", ["a"], 1, true, undefined, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(useSearchFilterStore.getState().selectedSources).toEqual(["b"]);
    fireEvent.click(screen.getByRole("option", { name: /Work a/ }));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("cancels old source requests and never paints A as B when responses arrive out of order", async () => {
    let finishA!: (data: GlobalSearchResponse) => void;
    const pendingA = new Promise<GlobalSearchResponse>((resolve) => { finishA = resolve; });
    const search = vi.spyOn(apiClient, "searchGlobal").mockImplementation((_query, ids) => ids[0] === "a" ? pendingA : Promise.resolve(response("b")));
    open();
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "work" } });
    await waitFor(() => expect(search).toHaveBeenCalled());
    await act(async () => { useDiscoveryScopeStore.setState({ sourceId: "b" }); });
    await screen.findByText("Work b");
    await act(async () => finishA(response("a")));
    expect(screen.queryByText("Work a")).toBeNull();
    expect(search.mock.calls[0][5]?.signal?.aborted).toBe(true);
  });

  it("shows provider failure as failure even while the Cari CTA is available", async () => {
    vi.spyOn(apiClient, "searchGlobal").mockResolvedValue({ resultsBySource: { a: { results: [], error: "Batas permintaan tercapai", errorCode: "RATE_LIMITED" } } });
    open();
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "work" } });
    await screen.findByText("Batas permintaan tercapai");
    expect(screen.queryByText("Tidak ada hasil di sumber Jelajah ini.")).toBeNull();
    expect(screen.getByText(/memakai pilihan sumber Cari/)).toBeTruthy();
  });

  it("does not search a disabled Jelajah source and does not broaden the scope", async () => {
    useSourcePreferencesStore.setState({ disabledSources: ["a"] });
    const search = vi.spyOn(apiClient, "searchGlobal").mockResolvedValue(response("b"));
    open();
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "work" } });
    await screen.findByText(/Sumber Jelajah yang dipilih sedang tidak tersedia/);
    expect(search).not.toHaveBeenCalled();
  });

  it("restores the original trigger focus on Escape", async () => {
    const trigger = open();
    await screen.findByRole("dialog", { name: "Quick Search" });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("removes the dialog immediately when Escape comes from its input", async () => {
    const trigger = open();
    const input = await screen.findByRole("combobox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Quick Search" })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("handles global Escape while the dialog is open regardless of the keyboard event target", async () => {
    const trigger = open();
    await screen.findByRole("dialog", { name: "Quick Search" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Quick Search" })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
