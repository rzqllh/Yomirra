import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReaderStore } from "@/shared/store/reader-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { PagedReader } from "../paged-reader";
import { ReaderView } from "../reader-view";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
}));

describe("PagedReader Component & Integration", () => {
  const mockPages = [
    { index: 0, url: "http://example.com/page-0.jpg" },
    { index: 1, url: "http://example.com/page-1.jpg" },
    { index: 2, url: "http://example.com/page-2.jpg" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useReaderStore.setState({
      preferences: {
        imageFit: "width",
        pageGap: "none",
        background: "black",
        toolbarBehavior: "auto-hide",
        preloadIntensity: "balanced",
        showPageProgress: true,
        readingDirection: "ltr",
        readingMode: "paged",
        keepScreenAwake: true,
      },
      isOverlayVisible: true,
      isDesktopPanelOpen: true,
    });
    useHistoryStore.setState({ items: {} });
    useDownloadStore.setState({ downloads: {}, queue: [], activeDownloads: [] });

    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  describe("Rendering & Page Counter", () => {
    it("should render page 1 initially and display page counter pill 1 / 3", () => {
      render(
        <PagedReader
          sourceId="src1"
          mangaId="manga1"
          chapterId="ch1"
          pages={mockPages}
        />
      );

      expect(screen.getByText("1 / 3")).toBeDefined();
    });
  });

  describe("LTR Navigation", () => {
    it("should advance on next page button click and ArrowRight key", async () => {
      render(
        <PagedReader
          sourceId="src1"
          mangaId="manga1"
          chapterId="ch1"
          pages={mockPages}
        />
      );

      expect(screen.getByText("1 / 3")).toBeDefined();

      const nextBtn = screen.getByLabelText("Halaman berikutnya");
      await act(async () => {
        fireEvent.click(nextBtn);
      });

      expect(screen.getByText("2 / 3")).toBeDefined();

      // Keyboard ArrowRight -> 3 / 3
      await act(async () => {
        fireEvent.keyDown(window, { key: "ArrowRight" });
      });

      expect(screen.getByText("3 / 3")).toBeDefined();
    });

    it("should return on previous page button click and ArrowLeft key", async () => {
      render(
        <PagedReader
          sourceId="src1"
          mangaId="manga1"
          chapterId="ch1"
          pages={mockPages}
        />
      );

      // Advance to page 2 first
      const nextBtn = screen.getByLabelText("Halaman berikutnya");
      await act(async () => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText("2 / 3")).toBeDefined();

      // Keyboard ArrowLeft -> 1 / 3
      await act(async () => {
        fireEvent.keyDown(window, { key: "ArrowLeft" });
      });

      expect(screen.getByText("1 / 3")).toBeDefined();
    });
  });

  describe("RTL Navigation Semantics", () => {
    it("should reverse directional tap & ArrowLeft/ArrowRight controls when readingDirection is rtl", async () => {
      useReaderStore.setState({
        preferences: {
          ...useReaderStore.getState().preferences,
          readingDirection: "rtl",
        },
      });

      render(
        <PagedReader
          sourceId="src1"
          mangaId="manga1"
          chapterId="ch1"
          pages={mockPages}
        />
      );

      expect(screen.getByText("1 / 3")).toBeDefined();

      // In RTL, ArrowLeft advances to next page
      await act(async () => {
        fireEvent.keyDown(window, { key: "ArrowLeft" });
      });

      expect(screen.getByText("2 / 3")).toBeDefined();

      // In RTL, ArrowRight returns to previous page
      await act(async () => {
        fireEvent.keyDown(window, { key: "ArrowRight" });
      });

      expect(screen.getByText("1 / 3")).toBeDefined();
    });
  });

  describe("Boundaries Clamping", () => {
    it("should not navigate before page 1 or past final page when no adjacent chapters exist", async () => {
      render(
        <PagedReader
          sourceId="src1"
          mangaId="manga1"
          chapterId="ch1"
          pages={mockPages}
        />
      );

      // On page 1, previous should remain on page 1
      const prevBtn = screen.getByLabelText("Halaman sebelumnya");
      await act(async () => {
        fireEvent.click(prevBtn);
      });
      expect(screen.getByText("1 / 3")).toBeDefined();

      // Advance to last page (3 / 3)
      const nextBtn = screen.getByLabelText("Halaman berikutnya");
      await act(async () => {
        fireEvent.click(nextBtn);
      });
      await act(async () => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText("3 / 3")).toBeDefined();

      // Clicking next again should remain on 3 / 3
      await act(async () => {
        fireEvent.click(nextBtn);
      });
      expect(screen.getByText("3 / 3")).toBeDefined();
    });
  });

  describe("Mode Integration in ReaderView", () => {
    it("should render PagedReader when readingMode === 'paged'", () => {
      useReaderStore.setState({
        preferences: {
          ...useReaderStore.getState().preferences,
          readingMode: "paged",
        },
      });

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch1"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[{ id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" }]}
            initialPages={mockPages}
          />
        </QueryClientProvider>
      );

      // Should render PagedReader counter pill 1 / 3
      expect(screen.getByText("1 / 3")).toBeDefined();
    });
  });
});
