import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Link from "next/link"
import { LibraryResults } from "../library-results"
import { LibraryToolbar } from "../library-toolbar"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("../library-filter-drawer", () => ({
  LibraryFilterDrawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/manga/view-mode-toggle", () => ({
  ViewModeToggle: () => <div data-testid="view-mode-toggle" />,
}))

vi.mock("@/components/manga/card", () => ({
  ShelfCard: ({ manga }: { manga: { title: string } }) => (
    <Link href="/manga" data-testid="shelf-card">
      {manga.title}
    </Link>
  ),
}))

vi.mock("@/components/manga/card/compact-card", () => ({
  CompactCard: ({ manga }: { manga: { title: string } }) => (
    <Link href="/manga" data-testid="compact-card">
      {manga.title}
    </Link>
  ),
}))

const baseProps = {
  isDisabled: false,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
  mangas: [{ id: "manga-a", title: "Manga A" }],
  viewMode: "grid" as const,
  activeSourceId: "source-a",
  libraryItems: {},
  selectedCollections: [],
  selectedGenres: [],
  excludedGenres: [],
  selectedFormats: [],
  selectedStatuses: [],
  selectedReadingStatuses: [],
  query: "",
  page: 1,
  setPage: vi.fn(),
  hasNextPage: false,
  onResetFilters: vi.fn(),
}

describe("Library selection mode accessibility", () => {
  it("makes the underlying card inert and exposes toggle selection state", () => {
    render(
      <LibraryResults
        {...baseProps}
        isSelectionMode
        selectedItems={new Set(["source-a::manga-a"])}
        onToggleSelectItem={vi.fn()}
      />
    )

    const card = screen.getByTestId("shelf-card")
    const selectionButton = screen.getByRole("button", { name: "Batal pilih Manga A" })

    expect(card.parentElement?.hasAttribute("inert")).toBe(true)
    expect(selectionButton.getAttribute("aria-pressed")).toBe("true")
  })

  it("provides selection mode toggle via options dropdown", () => {
    render(
      <LibraryToolbar
        searchInput=""
        onSearchInputChange={vi.fn()}
        onSearchSubmit={vi.fn()}
        onSearchClear={vi.fn()}
        activeSourceId="source-a"
        activeFilterCount={0}
        isSelectionMode
        onToggleSelectionMode={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Opsi lainnya" })).toBeTruthy()
  })
})
