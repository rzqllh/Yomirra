import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useReaderScroll } from "../use-reader-scroll";
import { QueryClient } from "@tanstack/react-query";
import type { StreamItem } from "@/components/reader/continuous-vertical-reader";

describe("useReaderScroll - Q80 Durability & Q84 Debounce Throttle", () => {
  let queryClient: QueryClient;
  let saveProgress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    saveProgress = vi.fn();

    // Mock window scroll properties
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 5000, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockStreamItems: StreamItem[] = [
    { type: "image", chapterId: "ch-1", pageIndex: 0, url: "https://example.com/p0.jpg" },
    { type: "image", chapterId: "ch-1", pageIndex: 1, url: "https://example.com/p1.jpg" },
    { type: "image", chapterId: "ch-1", pageIndex: 2, url: "https://example.com/p2.jpg" },
  ];

  const createMockVirtualizer = (centerIndex = 1) => {
    return {
      getVirtualItems: vi.fn(() => [
        { index: 0, start: 0, end: 1000 },
        { index: 1, start: 1000, end: 2000 },
        { index: 2, start: 2000, end: 3000 },
      ]),
    } as any;
  };

  it("registers scroll listener and does not invoke saveProgress before debounce interval (Q84)", () => {
    const virtualizer = createMockVirtualizer(1);

    renderHook(() =>
      useReaderScroll({
        streamItems: mockStreamItems,
        virtualizer,
        sourceId: "asurascans",
        mangaId: "solo-leveling",
        chapterId: "ch-1",
        saveProgress,
        queryClient,
        isReadyToTrack: true,
      })
    );

    // Simulate scrolling into page index 1 (scrollY = 1200)
    window.scrollY = 1200;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(50);
    });

    // Q84: Save must be throttled / debounced (300ms idle timer)
    expect(saveProgress).not.toHaveBeenCalled();

    // Advance beyond 300ms debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(saveProgress).toHaveBeenCalledTimes(1);
    expect(saveProgress).toHaveBeenCalledWith(
      "asurascans",
      "solo-leveling",
      "ch-1",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("coalesces multiple rapid scroll events into a single flush (Q84)", () => {
    const virtualizer = createMockVirtualizer();

    renderHook(() =>
      useReaderScroll({
        streamItems: mockStreamItems,
        virtualizer,
        sourceId: "asurascans",
        mangaId: "solo-leveling",
        chapterId: "ch-1",
        saveProgress,
        queryClient,
        isReadyToTrack: true,
      })
    );

    // Rapid scrolling
    for (let i = 0; i < 5; i++) {
      window.scrollY = 1000 + i * 50;
      act(() => {
        window.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });
    }

    // Still within idle debounce window from last scroll
    expect(saveProgress).not.toHaveBeenCalled();

    // Idle for 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(saveProgress).toHaveBeenCalledTimes(1);
  });

  it("Q80: flushes pending progress immediately on unmount to prevent data loss", () => {
    const virtualizer = createMockVirtualizer();

    const { unmount } = renderHook(() =>
      useReaderScroll({
        streamItems: mockStreamItems,
        virtualizer,
        sourceId: "asurascans",
        mangaId: "solo-leveling",
        chapterId: "ch-1",
        saveProgress,
        queryClient,
        isReadyToTrack: true,
      })
    );

    // User scrolls then immediately leaves/unmounts before 300ms debounce completes
    window.scrollY = 1200;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(16);
    });

    // Unmount hook before timer fires
    act(() => {
      unmount();
    });

    // Must flush immediately without losing position
    expect(saveProgress).toHaveBeenCalledTimes(1);
    expect(saveProgress).toHaveBeenCalledWith(
      "asurascans",
      "solo-leveling",
      "ch-1",
      expect.any(Number),
      expect.any(Number)
    );
  });
});
