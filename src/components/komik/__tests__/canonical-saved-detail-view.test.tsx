import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanonicalSavedPage from "@/app/(web)/catalog/saved/[savedTitleId]/page";
import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useAlternateSource } from "@/shared/hooks/use-alternate-source";
import { CanonicalSavedDetailView } from "../canonical-saved-detail-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/lib/navigation-intent", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/shared/lib/navigation-intent")>(),
  beginNavigationIntent,
}));
vi.mock("@/shared/hooks/use-nsfw-source-ids");
vi.mock("@/shared/hooks/use-alternate-source");

const openAndSearch = vi.fn();
const push = vi.hoisted(() => vi.fn());
const beginNavigationIntent = vi.hoisted(() => vi.fn(() => true));

const item = {
  id: "saved-title",
  sourceId: "shinigami",
  mangaId: "current-id",
  title: "The Regressed Mercenary’s Machinations",
  addedAt: "2026-11-21",
  updatedAt: "2026-11-28",
  linkedSources: [
    { sourceId: "komiku", mangaId: "old-id", addedAt: 0, matchConfidence: "CONFIRMED" },
    { sourceId: "komiku", mangaId: "unverified-id", addedAt: 0, matchConfidence: "HIGH_CONFIDENCE" },
  ],
} satisfies LibraryItem;

describe("CanonicalSavedPage", () => {
  it.each([
    ["saved-title", "saved-title"],
    ["shinigami%3A%3Acurrent-id", "shinigami::current-id"],
    ["shinigami%3A%3Atitle%2520literal", "shinigami::title%20literal"],
    ["shinigami%ZZ", "shinigami%ZZ"],
  ])("resolves route segment %s to %s", async (segment, savedTitleId) => {
    const page = await CanonicalSavedPage({ params: Promise.resolve({ savedTitleId: segment }) });
    expect(page.props.savedTitleId).toBe(savedTitleId);
  });
});

describe("CanonicalSavedDetailView", () => {
  beforeEach(() => {
    useLibraryStore.setState({ items: { "legacy-storage-key": item } });
    useSettingsStore.setState({ hideNsfw: true, perTitleSourcePreferences: {} });
    useSourcePreferencesStore.setState({ disabledSources: [] });
    openAndSearch.mockClear();
    push.mockClear();
    beginNavigationIntent.mockClear();
    vi.mocked(useNsfwSourceIds).mockReturnValue({ status: "KNOWN", ids: new Set() });
    vi.mocked(useAlternateSource).mockReturnValue({
      openAndSearch,
      isOpen: false,
      setIsOpen: vi.fn(),
      isSearching: false,
      candidates: [],
      chapterMapResult: undefined,
      mappingChapterTitle: undefined,
      handleConfirm: vi.fn(),
      title: item.title,
    });
  });

  it.each(["saved-title", "legacy-storage-key", "shinigami::current-id", "komiku::old-id"])(
    "resolves saved identity %s",
    (savedTitleId) => {
      render(<CanonicalSavedDetailView savedTitleId={savedTitleId} />);
      expect(screen.getByRole("heading", { name: item.title })).toBeTruthy();
    },
  );

  it("does not resolve an unverified alternate", () => {
    render(<CanonicalSavedDetailView savedTitleId="komiku::unverified-id" />);
    expect(screen.getByRole("heading", { name: "Katalog tidak tersedia" })).toBeTruthy();
  });

  it("starts the contextual finder for an unavailable saved source", () => {
    useSourcePreferencesStore.setState({ disabledSources: [item.sourceId, "komiku"] });
    render(<CanonicalSavedDetailView savedTitleId="saved-title" />);
    expect(screen.queryByRole("button", { name: "Pilih sumber" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lanjut baca" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cari alternatif" }));

    expect(useAlternateSource).toHaveBeenCalledWith(expect.objectContaining({
      sourceId: item.sourceId,
      mangaId: item.mangaId,
      knownTitle: item.title,
      knownAuthor: undefined,
      blockedSourceIds: new Set(),
    }));
    expect(openAndSearch).toHaveBeenCalledTimes(1);
  });

  it("offers a verified alternate without opening it or changing the primary source", () => {
    useLibraryStore.setState({ items: { [item.id]: {
      ...item,
      linkedSources: [{ sourceId: "mangadex", mangaId: "verified", addedAt: 0, matchConfidence: "CONFIRMED" }],
    } } });
    useSettingsStore.setState({ perTitleSourcePreferences: { [item.id]: item.sourceId } });
    useSourcePreferencesStore.setState({ disabledSources: [item.sourceId] });
    render(<CanonicalSavedDetailView savedTitleId={item.id} />);

    fireEvent.click(screen.getByRole("button", { name: "Pilih sumber" }));
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Sumber bacaan" }));
    expect(screen.getByRole("link", { name: "Buka" }).getAttribute("href")).toContain("/manga/mangadex/verified");
    expect(screen.queryByRole("button", { name: "Cari alternatif" })).toBeNull();
    expect(push).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().perTitleSourcePreferences[item.id]).toBe(item.sourceId);
  });

  it("returns to the same encoded saved entry from its source link and primary action", () => {
    useSettingsStore.setState({ perTitleSourcePreferences: { [item.id]: item.sourceId } });
    render(<CanonicalSavedDetailView savedTitleId="shinigami::current-id" />);

    const expectedHref = "/manga/shinigami/current-id?returnTo=%2Fcatalog%2Fsaved%2Fshinigami%253A%253Acurrent-id";
    expect(screen.getAllByRole("link", { name: "Buka" }).map(link => link.getAttribute("href")))
      .toContain(expectedHref);

    fireEvent.click(screen.getByRole("button", { name: "Buka komik" }));
    expect(beginNavigationIntent).toHaveBeenCalledWith(expectedHref);
    expect(push).toHaveBeenCalledWith(expectedHref);
  });

  it("keeps downloads available offline and suppresses online recovery actions", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      render(<CanonicalSavedDetailView savedTitleId={item.id} />);
      expect(screen.getByRole("link", { name: "Buka unduhan" }).getAttribute("href")).toBe("/downloads");
      expect(screen.getByRole("status").textContent).toBe("Perangkat sedang offline.");
      expect(screen.queryByRole("button", { name: "Cari alternatif" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Pilih sumber" })).toBeNull();
    } finally {
      online.mockRestore();
    }
  });

  it("lets the reader resolve disagreeing alias preferences explicitly", () => {
    useSettingsStore.setState({ perTitleSourcePreferences: {
      "shinigami::current-id": "shinigami",
      "komiku::old-id": "komiku",
    } });
    render(<CanonicalSavedDetailView savedTitleId={item.id} />);

    expect(screen.getByRole("button", { name: "Pilih sumber" })).toBeTruthy();
    expect(screen.queryByText(/Sumber utama:/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Lanjut baca" })).toBeNull();
    const choices = screen.getAllByRole("button", { name: "Jadikan utama" });
    expect(choices).toHaveLength(2);

    fireEvent.click(choices[0]);
    expect(screen.getByText(/Sumber utama:/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Jadikan utama" })).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("waits for content classification before displaying a saved title", () => {
    vi.mocked(useNsfwSourceIds).mockReturnValue({ status: "LOADING", ids: new Set() });
    const { rerender } = render(<CanonicalSavedDetailView savedTitleId="saved-title" />);
    expect(screen.getByRole("status").textContent).toBe("Memuat katalog…");
    expect(screen.queryByText(item.title)).toBeNull();

    vi.mocked(useNsfwSourceIds).mockReturnValue({ status: "KNOWN", ids: new Set(["shinigami"]) });
    rerender(<CanonicalSavedDetailView savedTitleId="saved-title" />);
    expect(screen.getByRole("heading", { name: "Katalog tidak tersedia" })).toBeTruthy();
  });
});
