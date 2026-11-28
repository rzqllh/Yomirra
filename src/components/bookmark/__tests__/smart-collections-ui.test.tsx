import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShelfCard } from "@/components/komik/card";
import { CollectionTab } from "../collection-tab";
import type { MangaUpdateItem } from "@/shared/types/update";

vi.mock("@/components/komik/card", () => ({
  ShelfCard: vi.fn(({ manga }: { manga: { title: string } }) => <div>{manga.title}</div>),
}));

const { updates } = vi.hoisted(() => {
  const updates: Record<string, MangaUpdateItem> = {
    "saved-a": { sourceId: "source-a", mangaId: "a", mangaTitle: "A", latestChapterId: "ch-81", latestChapterTitle: "Chapter 81" },
    "source-a::b": { sourceId: "source-a", mangaId: "b", mangaTitle: "B", latestChapterId: "ch-0", latestChapterNumber: 0 },
    "saved-c": { sourceId: "source-a", mangaId: "c", mangaTitle: "C", latestChapterId: "ch-99", latestChapterNumber: 99, detectedSourceId: "source-b" },
    "saved-d": { sourceId: "source-b", mangaId: "d", mangaTitle: "D", latestChapterId: "ch-999", latestChapterNumber: 999 },
    "saved-e": { sourceId: "source-a", mangaId: "e", mangaTitle: "E", latestChapterId: "ch-999", latestChapterNumber: 999, error: "Unavailable" },
  };
  return { updates };
});

vi.mock("@/shared/store/update-store", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/shared/store/update-store")>(),
  useUpdateStore: (selector: (state: { items: typeof updates }) => unknown) => selector({ items: updates }),
}));

describe("CollectionTab smart collections", () => {
  it("separates automatic filters from user-created collections", () => {
    const onSelectSmart = vi.fn();
    const onSelectCollection = vi.fn();

    render(
      <CollectionTab
        searchQuery=""
        onSearchChange={vi.fn()}
        onSearchClear={vi.fn()}
        sortBy="updatedAt"
        onSortChange={vi.fn()}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedItems={new Set()}
        onToggleSelectItem={vi.fn()}
        onSelectAll={vi.fn()}
        isDeleteDialogOpen={false}
        onOpenDeleteDialogChange={vi.fn()}
        onConfirmBulkDelete={vi.fn()}
        totalItemsCount={6}
        filteredCount={6}
        paginatedCollection={[
          { id: "saved-a", sourceId: "source-a", mangaId: "a", title: "A" },
          { sourceId: "source-a", mangaId: "b", title: "B" },
          { id: "saved-c", sourceId: "source-a", mangaId: "c", title: "C" },
          { id: "saved-d", sourceId: "source-a", mangaId: "d", title: "D" },
          { id: "saved-e", sourceId: "source-a", mangaId: "e", title: "E" },
          { sourceId: "source-a", mangaId: "f", title: "F" },
        ]}
        collectionPage={1}
        setCollectionPage={vi.fn()}
        totalPages={1}
        smartCollections={[
          {
            id: "continue-reading",
            label: "Lanjut Dibaca",
            items: [
              {
                id: "a",
                sourceId: "source-a",
                mangaId: "a",
                title: "A",
                addedAt: "2026-09-01T00:00:00.000Z",
                updatedAt: "2026-09-29T00:00:00.000Z",
              },
            ],
          },
          {
            id: "stale",
            label: "Lama Tidak Dibuka",
            items: [],
          },
        ]}
        selectedSmartCollectionId={null}
        onSelectSmartCollectionId={onSelectSmart}
        collections={[
          {
            id: "favorites",
            name: "Favorit",
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
            sortOrder: 0,
          },
        ]}
        membershipsByManga={{ a: ["favorites"] }}
        selectedCollectionId={null}
        onSelectCollectionId={onSelectCollection}
      />
    );

    expect(screen.getByText("Otomatis")).toBeTruthy();
    expect(screen.getByText("Koleksi Kamu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lanjut Dibaca, 1 judul" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lama Tidak Dibuka, 0 judul" })).toBeNull();
    expect(screen.getByRole("button", { name: "Favorit, 1 judul" })).toBeTruthy();
    const chaptersByTitle = Object.fromEntries(vi.mocked(ShelfCard).mock.calls.map(([props]) => [
      props.manga.title, props.savedChapterUpdates,
    ]));
    expect(chaptersByTitle).toEqual({
      A: [updates["saved-a"]],
      B: [updates["source-a::b"]],
      C: [updates["saved-c"]],
      D: [],
      E: [updates["saved-e"]],
      F: [],
    });

    fireEvent.click(screen.getByRole("button", { name: "Lanjut Dibaca, 1 judul" }));
    expect(onSelectSmart).toHaveBeenCalledWith("continue-reading");

    fireEvent.click(screen.getByRole("button", { name: "Favorit, 1 judul" }));
    expect(onSelectCollection).toHaveBeenCalledWith("favorites");
  });

  it("keeps an empty selected automatic filter visible so it can be cleared", () => {
    render(
      <CollectionTab
        searchQuery=""
        onSearchChange={vi.fn()}
        onSearchClear={vi.fn()}
        sortBy="updatedAt"
        onSortChange={vi.fn()}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedItems={new Set()}
        onToggleSelectItem={vi.fn()}
        onSelectAll={vi.fn()}
        isDeleteDialogOpen={false}
        onOpenDeleteDialogChange={vi.fn()}
        onConfirmBulkDelete={vi.fn()}
        totalItemsCount={1}
        filteredCount={0}
        paginatedCollection={[]}
        collectionPage={1}
        setCollectionPage={vi.fn()}
        totalPages={1}
        smartCollections={[
          {
            id: "stale",
            label: "Lama Tidak Dibuka",
            items: [],
          },
        ]}
        selectedSmartCollectionId="stale"
        onSelectSmartCollectionId={vi.fn()}
        selectedCollectionId={null}
        onClearCollectionFilters={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Lama Tidak Dibuka, 0 judul" })
    ).toBeTruthy();
    expect(screen.getByText("Belum ada bookmark yang masuk kategori ini.")).toBeTruthy();
  });

  it("places Otomatis helper label inline, uses raised SearchInput surface, and links empty CTA to Katalog", () => {
    const { container } = render(
      <CollectionTab
        searchQuery=""
        onSearchChange={vi.fn()}
        onSearchClear={vi.fn()}
        sortBy="updatedAt"
        onSortChange={vi.fn()}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedItems={new Set()}
        onToggleSelectItem={vi.fn()}
        onSelectAll={vi.fn()}
        isDeleteDialogOpen={false}
        onOpenDeleteDialogChange={vi.fn()}
        onConfirmBulkDelete={vi.fn()}
        totalItemsCount={0}
        filteredCount={0}
        paginatedCollection={[]}
        collectionPage={1}
        setCollectionPage={vi.fn()}
        totalPages={1}
        smartCollections={[]}
        selectedSmartCollectionId={null}
        onSelectSmartCollectionId={vi.fn()}
        selectedCollectionId={null}
      />
    );

    const autoHeading = screen.getByText("Otomatis").parentElement;
    expect(autoHeading?.className).toContain("gap-2");
    expect(autoHeading?.className).not.toContain("justify-between");

    const searchForm = container.querySelector("form");
    expect(searchForm?.className).toContain("bg-surface-raised");

    const cta = screen.getByRole("link", { name: /Jelajahi Katalog/i });
    expect(cta.getAttribute("href")).toBe("/library");
  });
});
