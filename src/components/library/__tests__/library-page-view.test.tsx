import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LibraryPageView } from "../library-page-view";

vi.mock("@/shared/hooks/use-library-catalog", () => ({
  useLibraryCatalog: () => ({
    isMounted: true,
    searchInput: "",
    setSearchInput: vi.fn(),
    handleSearchSubmit: vi.fn(),
    setQuery: vi.fn(),
    setPage: vi.fn(),
    activeSourceId: "mangadex",
    activeFilterCount: 0,
    sort: "popular",
    handleTabChange: vi.fn(),
    DYNAMIC_SORTS: [],
    selectedFormats: [],
    isDisabled: false,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    mangas: [],
    viewMode: "grid",
    libraryItems: {},
    selectedCollections: [],
    selectedGenres: [],
    excludedGenres: [],
    selectedStatuses: [],
    selectedReadingStatuses: [],
    query: "",
    page: 1,
    data: { hasNextPage: false },
    resetFilters: vi.fn(),
  }),
}));

vi.mock("../library-toolbar", () => ({
  LibraryToolbar: () => <div data-testid="library-toolbar" />,
}));

vi.mock("../library-status-rail", () => ({
  LibraryStatusRail: () => <div data-testid="library-status-rail" />,
}));

vi.mock("../library-results", () => ({
  LibraryResults: () => <div data-testid="library-results" />,
}));

vi.mock("../guest-sync-banner", () => ({
  GuestSyncBanner: () => <div data-testid="guest-sync-banner" />,
}));

vi.mock("@/components/app/header-actions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

describe("LibraryPageView hierarchy", () => {
  it("renders accessible sr-only h1 and does not render legacy hero header", () => {
    render(<LibraryPageView />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Library");
    expect(heading.className).toContain("sr-only");

    expect(screen.queryByText("Rak Bacaan")).toBeNull();
    expect(
      screen.queryByText("Komik yang kamu simpan, siap dibaca lagi kapan saja.")
    ).toBeNull();
  });

  it("renders mobile utility header with source link and HeaderActions", () => {
    render(<LibraryPageView />);

    expect(screen.getByTestId("header-actions")).toBeTruthy();
    expect(screen.getByText("mangadex")).toBeTruthy();
  });

  it("renders toolbar and results inside PageContainer", () => {
    const { container } = render(<LibraryPageView />);

    expect(screen.getByTestId("library-toolbar")).toBeTruthy();
    expect(screen.getByTestId("library-status-rail")).toBeTruthy();
    expect(screen.getByTestId("library-results")).toBeTruthy();

    // Check that PageContainer classes are present
    const pageContainer = container.querySelector(".max-w-none");
    expect(pageContainer).not.toBeNull();
    expect(pageContainer?.className).toContain("w-full");
    expect(pageContainer?.className).toContain("px-4");
    expect(pageContainer?.className).toContain("md:px-8");
    expect(pageContainer?.className).toContain("xl:px-10");
  });
});
