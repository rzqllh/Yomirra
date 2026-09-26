import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UnifiedFilterDrawer, isNsfwGenre } from "../unified-filter-drawer";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import { useLibraryFilterStore } from "@/shared/store/library-filter-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getSources: vi.fn().mockResolvedValue([
      {
        id: "shinigami",
        name: "Shinigami",
        isInstalled: true,
        capabilities: { search: true },
        isNsfw: false,
      },
    ]),
    getFilters: vi.fn().mockResolvedValue({
      genres: [
        { id: "action", name: "Action" },
        { id: "comedy", name: "Comedy" },
        { id: "adult", name: "Adult" },
        { id: "ecchi", name: "Ecchi" },
        { id: "mature", name: "Mature" },
      ],
      statuses: [
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
      ],
      sorts: [
        { id: "popular", name: "Populer" },
        { id: "latest", name: "Terbaru" },
      ],
      formats: [
        { id: "manhwa", name: "Manhwa" },
        { id: "manga", name: "Manga" },
      ],
    }),
  },
}));

describe("UnifiedFilterDrawer — Section Consistency & NSFW Gating", () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    useSettingsStore.setState({ hideNsfw: true });
    useSearchFilterStore.getState().resetFilters();
    useLibraryFilterStore.getState().resetFilters();
  });

  it("identifies NSFW genres correctly", () => {
    expect(isNsfwGenre({ id: "adult", label: "Adult" })).toBe(true);
    expect(isNsfwGenre({ id: "ecchi", label: "Ecchi" })).toBe(true);
    expect(isNsfwGenre({ id: "mature", label: "Mature" })).toBe(true);
    expect(isNsfwGenre({ id: "smut", label: "Smut" })).toBe(true);
    expect(isNsfwGenre({ id: "yaoi", label: "Yaoi" })).toBe(true);
    expect(isNsfwGenre({ id: "yuri", label: "Yuri" })).toBe(true);
    expect(isNsfwGenre({ id: "action", label: "Action" })).toBe(false);
    expect(isNsfwGenre({ id: "comedy", label: "Comedy" })).toBe(false);
  });

  it("filters out mature genres when hideNsfw is true in Search context", async () => {
    useSettingsStore.setState({ hideNsfw: true });

    render(<UnifiedFilterDrawer context="search" />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));

    await waitFor(() => {
      expect(screen.getByText("Action")).toBeDefined();
    });

    expect(screen.getByText("Comedy")).toBeDefined();
    expect(screen.queryByText("Adult")).toBeNull();
    expect(screen.queryByText("Ecchi")).toBeNull();
    expect(screen.queryByText("Mature")).toBeNull();

    // Check unified section label "Status Rilis"
    expect(screen.getByText("Status Rilis")).toBeDefined();
  });

  it("includes mature genres when hideNsfw is false in Search context", async () => {
    useSettingsStore.setState({ hideNsfw: false });

    render(<UnifiedFilterDrawer context="search" />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));

    await waitFor(() => {
      expect(screen.getByText("Action")).toBeDefined();
    });

    expect(screen.getByText("Adult")).toBeDefined();
    expect(screen.getByText("Ecchi")).toBeDefined();
  });

  it("uses unified 'Status Rilis' label in Library context", async () => {
    render(<UnifiedFilterDrawer context="library" activeSourceId="shinigami" />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));

    await waitFor(() => {
      expect(screen.getByText("Status Rilis")).toBeDefined();
    });

    // Make sure old inconsistent "STATUS" alone is not the heading
    expect(screen.getByRole("heading", { name: "Status Rilis" })).toBeDefined();
  });
});
