import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LibraryFilterDrawer } from "../library-filter-drawer";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { apiClient } from "@/shared/api-client";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getSources: vi.fn(),
    getFilters: vi.fn(),
  },
}));

// Mock the ResizeObserver which is needed by Radix UI / Vaul
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("LibraryFilterDrawer (Slice 2.3)", () => {
  const queryClient = new QueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.mocked(apiClient.getSources).mockResolvedValue([
      {
        id: "testSrc",
        name: "Test Source",
        isInstalled: true,
        isEnabled: true,
        capabilities: { search: true, filters: true },
        isNsfw: false,
        isDynamic: false,
      },
      {
        id: "doujindesu",
        name: "Provider Source",
        isInstalled: true,
        isEnabled: true,
        capabilities: { search: true, filters: true },
        isNsfw: false,
        isDynamic: false,
      },
    ] as any);
    vi.mocked(apiClient.getFilters).mockResolvedValue({
      genres: [{ id: "harem", name: "Harem" }],
      formats: [],
      statuses: [
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
      ],
      sorts: [
        { id: "popular", name: "Populer" },
        { id: "latest", name: "Terbaru" },
      ],
    });

    useLibraryFilterStore.setState({
      selectedGenres: [],
      excludedGenres: [],
      selectedFormats: [],
      selectedStatuses: [],
      selectedCollections: [],
      selectedReadingStatuses: [],
      sort: "popular",
      query: "",
    });
    
    useCollectionStore.setState({
      collections: [
        { id: "c1", name: "My Favs", sortOrder: 0, createdAt: "", updatedAt: "" }
      ],
      membershipsByManga: {},
      readingStatusByManga: {},
    });
  });

  it("updates store when local collection filter is applied", async () => {
    render(<LibraryFilterDrawer activeSourceId="testSrc" />, { wrapper });
    
    // Open drawer
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));
    
    // Select Collection
    await waitFor(() => {
      expect(screen.getByText("My Favs")).toBeDefined();
    });
    fireEvent.click(screen.getByText("My Favs"));
    
    // Select Reading Status
    expect(screen.getByText("Sedang Dibaca")).toBeDefined();
    fireEvent.click(screen.getByText("Sedang Dibaca"));
    
    // Apply filters
    fireEvent.click(screen.getByRole("button", { name: "Terapkan Filter" }));
    
    const state = useLibraryFilterStore.getState();
    expect(state.selectedCollections).toContain("c1");
    expect(state.selectedReadingStatuses).toContain("reading");
  });

  it("applies provider genre filters returned for Doujindesu", async () => {
    render(<LibraryFilterDrawer activeSourceId="doujindesu" />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));

    await waitFor(() => {
      expect(screen.getByText("Harem")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Harem"));
    fireEvent.click(screen.getByRole("button", { name: "Terapkan Filter" }));

    expect(apiClient.getFilters).toHaveBeenCalledWith("doujindesu");
    expect(useLibraryFilterStore.getState().selectedGenres).toEqual(["harem"]);
  });

  it("resets local filters", async () => {
    useLibraryFilterStore.setState({
      selectedCollections: ["c1"],
      selectedReadingStatuses: ["reading"],
    });

    render(<LibraryFilterDrawer activeSourceId="testSrc" />, { wrapper });
    
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reset" })).toBeDefined();
    });
    
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Terapkan Filter" }));
    
    const state = useLibraryFilterStore.getState();
    expect(state.selectedCollections.length).toBe(0);
    expect(state.selectedReadingStatuses.length).toBe(0);
  });
});
