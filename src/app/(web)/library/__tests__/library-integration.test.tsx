import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdatesPage from "@/app/(web)/updates/page";
import { LibraryPageView } from "@/components/library/library-page-view";

// Mock next/navigation
const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/library",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// Mock hooks
vi.mock("@/shared/hooks/use-library-catalog", () => ({
  useLibraryCatalog: () => ({
    isMounted: true,
    totalLibraryCount: 10,
    mangas: [],
    searchInput: "",
    setSearchInput: vi.fn(),
    handleSearchSubmit: vi.fn(),
    activeSourceId: "dummy-source",
    activeFilterCount: 0,
    collections: [],
    libraryItems: {},
    membershipsByManga: {},
    selectedCollections: [],
    setPage: vi.fn(),
    handleTabChange: vi.fn(),
    DYNAMIC_SORTS: [],
    selectedReadingStatuses: [],
    isDisabled: false,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    viewMode: "grid",
    selectedGenres: [],
    excludedGenres: [],
    selectedFormats: [],
    selectedStatuses: [],
    query: "",
    page: 1,
    data: { hasNextPage: false },
    resetFilters: vi.fn(),
  }),
}));

vi.mock("@/components/library/library-toolbar", () => ({
  LibraryToolbar: () => <div data-testid="library-toolbar">Library Toolbar</div>,
}));

vi.mock("@/components/library/library-status-rail", () => ({
  LibraryStatusRail: () => <div data-testid="library-status-rail">Library Status Rail</div>,
}));

vi.mock("@/components/library/library-collection-rail", () => ({
  LibraryCollectionRail: () => <div data-testid="library-collection-rail">Library Collection Rail</div>,
}));

vi.mock("@/components/library/library-results", () => ({
  LibraryResults: () => <div data-testid="library-results">Library Results</div>,
}));

vi.mock("@/components/updates/updates-list", () => ({
  UpdatesList: () => <div data-testid="updates-list">Updates List</div>,
}));

describe("Library & Updates Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders UpdatesPage with weekly calendar updates list", () => {
    render(<UpdatesPage />);
    expect(screen.getAllByText("Jadwal Rilis Mingguan").length).toBeGreaterThan(0);
    expect(screen.getByTestId("updates-list")).toBeTruthy();
  });

  it("renders the library controls and results", () => {
    render(<LibraryPageView />);
    expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeTruthy();
    expect(screen.getByTestId("library-toolbar")).toBeTruthy();
    expect(screen.getByTestId("library-results")).toBeTruthy();
  });
});
