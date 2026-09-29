import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CollectionTab } from "../collection-tab";

vi.mock("@/components/manga/card", () => ({
  ShelfCard: ({ manga }: { manga: { title: string } }) => (
    <div data-testid="shelf-card">{manga.title}</div>
  ),
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
        totalItemsCount={3}
        filteredCount={3}
        paginatedCollection={[
          { sourceId: "source-a", mangaId: "a", title: "A" },
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
});
