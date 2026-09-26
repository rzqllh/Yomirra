import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookmarkPageView } from "../bookmark-page-view";

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/bookmark",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/shared/hooks/use-bookmark-reading", () => ({
  useBookmarkReading: () => ({
    isMounted: true,
    groupedHistory: [],
    pendingDeletions: new Set(),
    handleRemoveHistory: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/use-bookmark-collection", () => ({
  useBookmarkCollection: () => ({
    isMounted: true,
    searchQuery: "",
    setSearchQuery: vi.fn(),
    sortBy: "updatedAt",
    setSortBy: vi.fn(),
    isSelectionMode: false,
    setIsSelectionMode: vi.fn(),
    selectedItems: new Set(),
    setSelectedItems: vi.fn(),
    toggleSelectItem: vi.fn(),
    handleSelectAll: vi.fn(),
    isDeleteDialogOpen: false,
    setIsDeleteDialogOpen: vi.fn(),
    handleConfirmBulkDelete: vi.fn(),
    filteredAndSortedLibraryItems: [],
    paginatedCollection: [],
    collectionPage: 1,
    setCollectionPage: vi.fn(),
    totalPages: 1,
    collections: [],
    membershipsByManga: {},
    selectedCollectionId: null,
    setSelectedCollectionId: vi.fn(),
    createCollection: vi.fn(),
    renameCollection: vi.fn(),
    deleteCollection: vi.fn(),
  }),
}));

vi.mock("@/shared/store/library-store", () => ({
  useLibraryStore: (selector: any) => selector({ items: {} }),
}));

vi.mock("@/shared/store/update-store", () => ({
  useUpdateStore: (selector: any) => selector({ getUnreadCount: () => 5 }),
}));

vi.mock("@/components/app/header-actions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

describe("BookmarkPageView hierarchy & standardization", () => {
  it("renders accessible sr-only h1 and omits legacy PageHeader", () => {
    render(<BookmarkPageView />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Rak Buku");
    expect(heading.className).toContain("sr-only");

    expect(
      screen.queryByText("Bacaan, koleksi, & pembaruan komik favoritmu")
    ).toBeNull();
  });

  it("renders SegmentedControl and trailing Jadwal Rilis utility link", () => {
    render(<BookmarkPageView />);

    expect(screen.getByText("Sedang Dibaca")).toBeTruthy();
    expect(screen.getByText("Bookmark")).toBeTruthy();

    const updateLink = screen.getByRole("link", { name: /Jadwal Rilis Mingguan/i });
    expect(updateLink).toBeTruthy();
    expect(updateLink.getAttribute("href")).toBe("/updates");
    expect(screen.getByText("5 baru")).toBeTruthy();
  });

  it("renders controls within PageContainer", () => {
    const { container } = render(<BookmarkPageView />);

    const pageContainer = container.querySelector(".max-w-none");
    expect(pageContainer).not.toBeNull();
    expect(pageContainer?.className).toContain("w-full");
    expect(pageContainer?.className).toContain("px-4");
    expect(pageContainer?.className).toContain("md:px-8");
    expect(pageContainer?.className).toContain("xl:px-10");
  });
});
