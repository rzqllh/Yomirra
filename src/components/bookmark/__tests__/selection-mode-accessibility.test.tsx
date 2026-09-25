import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Link from "next/link"
import { CollectionTab } from "../collection-tab"
import { CollectionToolbar } from "../collection-toolbar"

vi.mock("@/components/manga/card", () => ({
  ShelfCard: ({ manga }: { manga: { title: string } }) => (
    <Link href="/manga" data-testid="bookmark-card">
      {manga.title}
    </Link>
  ),
}))

describe("Bookmark selection mode accessibility", () => {
  it("makes the underlying card inert and exposes toggle selection state", () => {
    render(
      <CollectionTab
        searchQuery=""
        onSearchChange={vi.fn()}
        onSearchClear={vi.fn()}
        sortBy="updatedAt"
        onSortChange={vi.fn()}
        isSelectionMode
        onToggleSelectionMode={vi.fn()}
        selectedItems={new Set(["source-a::manga-a"])}
        onToggleSelectItem={vi.fn()}
        onSelectAll={vi.fn()}
        isDeleteDialogOpen={false}
        onOpenDeleteDialogChange={vi.fn()}
        onConfirmBulkDelete={vi.fn()}
        totalItemsCount={1}
        filteredCount={1}
        paginatedCollection={[
          { sourceId: "source-a", mangaId: "manga-a", title: "Manga A" },
        ]}
        collectionPage={1}
        setCollectionPage={vi.fn()}
        totalPages={1}
      />
    )

    const card = screen.getByTestId("bookmark-card")
    const selectionButton = screen.getByRole("button", { name: "Batal pilih Manga A" })

    expect(card.parentElement?.hasAttribute("inert")).toBe(true)
    expect(selectionButton.getAttribute("aria-pressed")).toBe("true")
  })

  it("marks the toolbar selection control as a pressed toggle", () => {
    render(
      <CollectionToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        onSearchClear={vi.fn()}
        sortBy="updatedAt"
        onSortChange={vi.fn()}
        isSelectionMode
        onToggleSelectionMode={vi.fn()}
        totalCount={1}
      />
    )

    expect(screen.getByRole("button", { name: "Batal pilih manga" }).getAttribute("aria-pressed")).toBe("true")
  })
})
