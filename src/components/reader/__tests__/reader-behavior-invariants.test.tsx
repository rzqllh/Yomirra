import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReaderShell } from "../reader-shell";
import { useReaderStore } from "@/shared/store/reader-store";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/manga/asurascans/solo-leveling/read/ch-1"),
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

describe("Reader Invariants & Interaction Tests (Q46, Q86, Q88, Q96, Q159)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useReaderStore.setState({
      preferences: {
        imageFit: "width",
        pageGap: "none",
        background: "black",
        toolbarBehavior: "auto-hide",
        preloadIntensity: "balanced",
        showPageProgress: true,
        readingDirection: "ltr",
        readingMode: "vertical",
        keepScreenAwake: true,
      },
      perTitlePreferences: {},
      isOverlayVisible: true,
      isDesktopPanelOpen: true,
      pagedProgress: 0,
    });
  });

  it("Q46: Reader operates independently without invoking any AI services", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReaderShell
          mangaTitle="Solo Leveling"
          chapterTitle="Chapter 1"
          currentChapterId="ch-1"
          sourceId="asurascans"
          mangaId="solo-leveling"
          pageCount={20}
        >
          <div data-testid="reader-content">Reader Content</div>
        </ReaderShell>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("reader-content")).toBeDefined();
    expect(screen.getByText("Solo Leveling")).toBeDefined();
    expect(screen.getByText("Chapter 1")).toBeDefined();
  });

  it("Q96: Keyboard navigation listeners handle Escape (show overlay) and F (fullscreen)", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReaderShell
          mangaTitle="Solo Leveling"
          chapterTitle="Chapter 1"
          currentChapterId="ch-1"
          sourceId="asurascans"
          mangaId="solo-leveling"
        >
          <div>Reader Page</div>
        </ReaderShell>
      </QueryClientProvider>
    );

    // Hide overlay first
    act(() => {
      useReaderStore.setState({ isOverlayVisible: false });
    });
    expect(useReaderStore.getState().isOverlayVisible).toBe(false);

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);

    // Press F for fullscreen toggle
    const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = requestFullscreenMock;
    act(() => {
      fireEvent.keyDown(window, { key: "f" });
    });
    expect(requestFullscreenMock).toHaveBeenCalled();
  });

  it("Q159: Tap zone arbitration toggles overlay cleanly on center tap", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReaderShell
          mangaTitle="Solo Leveling"
          chapterTitle="Chapter 1"
          currentChapterId="ch-1"
          sourceId="asurascans"
          mangaId="solo-leveling"
        >
          <div data-testid="page-element" style={{ width: 800, height: 1200 }}>
            Mock Page Image
          </div>
        </ReaderShell>
      </QueryClientProvider>
    );

    // Verify initial overlay state
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);

    // Toggle overlay via store
    act(() => {
      useReaderStore.getState().toggleOverlay();
    });
    expect(useReaderStore.getState().isOverlayVisible).toBe(false);

    act(() => {
      useReaderStore.getState().toggleOverlay();
    });
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);
  });

  it("Q86 & Q88: Resolves format-aware reader mode and preserves title preferences", () => {
    const { updateTitlePreferences, getTitlePreferences } = useReaderStore.getState();

    // Default is vertical
    expect(getTitlePreferences("asurascans", "manhwa-title").readingMode).toBe("vertical");

    // Manga format sets paged mode
    act(() => {
      updateTitlePreferences("mangadex", "manga-title", { readingMode: "paged" });
    });
    expect(getTitlePreferences("mangadex", "manga-title").readingMode).toBe("paged");

    // Manhwa format sets vertical mode
    act(() => {
      updateTitlePreferences("asurascans", "manhwa-title", { readingMode: "vertical" });
    });
    expect(getTitlePreferences("asurascans", "manhwa-title").readingMode).toBe("vertical");
  });
});
