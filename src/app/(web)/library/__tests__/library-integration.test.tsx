import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BookmarkPage from "@/app/(web)/bookmark/page";
import UpdatesPage from "@/app/(web)/updates/page";
import { LibraryPageView } from "@/components/library/library-page-view";

// Mock next/navigation
const mockRedirect = vi.fn();
const mockUseSearchParams = vi.fn(() => ({
  get: (key: string) => null,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useSearchParams: () => mockUseSearchParams(),
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
  }),
}));

vi.mock("@/components/library/koleksi-tab", () => ({
  KoleksiTab: () => <div data-testid="koleksi-tab">Koleksi Tab</div>,
}));

vi.mock("@/components/library/riwayat-tab", () => ({
  RiwayatTab: () => <div data-testid="riwayat-tab">Riwayat Tab</div>,
}));

vi.mock("@/components/updates/updates-list", () => ({
  UpdatesList: () => <div data-testid="updates-tab">Updates Tab</div>,
}));

describe("Phase 2 - Library Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects /bookmark to /library?tab=riwayat", () => {
    BookmarkPage();
    expect(mockRedirect).toHaveBeenCalledWith("/library?tab=riwayat");
  });

  it("redirects /updates to /library?tab=updates", () => {
    UpdatesPage();
    expect(mockRedirect).toHaveBeenCalledWith("/library?tab=updates");
  });

  it("renders Koleksi tab by default if no tab parameter", () => {
    mockUseSearchParams.mockReturnValueOnce({ get: () => null } as any);
    render(<LibraryPageView />);
    expect(screen.getByTestId("koleksi-tab")).toBeDefined();
  });

  it("renders Riwayat tab when tab=riwayat", () => {
    mockUseSearchParams.mockReturnValueOnce({ get: () => "riwayat" } as any);
    render(<LibraryPageView />);
    expect(screen.getByTestId("riwayat-tab")).toBeDefined();
  });

  it("renders Updates tab when tab=updates", () => {
    mockUseSearchParams.mockReturnValueOnce({ get: () => "updates" } as any);
    render(<LibraryPageView />);
    expect(screen.getByTestId("updates-tab")).toBeDefined();
  });
});
