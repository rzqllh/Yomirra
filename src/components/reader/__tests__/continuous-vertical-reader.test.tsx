import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ContinuousVerticalReader } from "../continuous-vertical-reader";

// Mock dependencies
vi.mock("@/shared/hooks/use-reader-scroll", () => ({
  useReaderScroll: () => ({
    scrollPercent: 0,
    scrollToIndex: vi.fn(),
    scrollTarget: null,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    prefetchQuery: vi.fn(),
  }),
}));

vi.mock("@/shared/store/settings-store", () => ({
  useSettingsStore: () => ({
    display: {
      imageFit: "width",
      dataSaver: false,
    },
  }),
}));

describe("ContinuousVerticalReader - Keyboard Navigation", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollBy", vi.fn());
    vi.stubGlobal("innerHeight", 1000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const defaultProps = {
    sourceId: "test-source",
    mangaId: "test-manga",
    chapterId: "test-chapter",
    chapterTitle: "Chapter 1",
    pages: [{ index: 0, url: "http://example.com/page1" }],
    chapters: [{ id: "test-chapter", title: "Chapter 1", mangaId: "test-manga", number: 1, date: "2024-01-01T00:00:00.000Z" }],
  };

  it("labels the chapter end without claiming verified completion", () => {
    const { getByText, queryByText } = render(<ContinuousVerticalReader {...defaultProps} />);
    expect(getByText("Akhir Chapter 1")).toBeTruthy();
    expect(queryByText("Chapter 1 selesai")).toBeNull();
  });

  it("should scroll down on Space", () => {
    render(<ContinuousVerticalReader {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    
    expect(window.scrollBy).toHaveBeenCalledWith({
      top: 900, // 1000 * 0.9
      behavior: "smooth"
    });
  });

  it("should scroll up on Shift+Space", () => {
    render(<ContinuousVerticalReader {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: " ", code: "Space", shiftKey: true });
    
    expect(window.scrollBy).toHaveBeenCalledWith({
      top: -900,
      behavior: "smooth"
    });
  });

  it("should ignore Space when target is an input", () => {
    render(
      <div>
        <input data-testid="input" />
        <ContinuousVerticalReader {...defaultProps} />
      </div>
    );
    
    const input = document.querySelector("input")!;
    fireEvent.keyDown(input, { key: " ", code: "Space" });
    
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("should navigate to next chapter directly without pre-navigation smooth scrolling", () => {
    const scrollToMock = vi.fn();
    vi.stubGlobal("scrollTo", scrollToMock);

    render(
      <ContinuousVerticalReader
        {...defaultProps}
        nextChapterId="test-chapter-2"
      />
    );

    // Initial mount on unread chapter calls instant scrollTo(top: 0) to ensure new chapter starts at top
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    scrollToMock.mockClear();

    const nextBtn = document.querySelector("button[class*='bg-accent']")!;
    expect(nextBtn).toBeTruthy();
    fireEvent.click(nextBtn);

    // Clicking next chapter should NOT trigger smooth scrolling on the old chapter
    expect(scrollToMock).not.toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("ContinuousVerticalReader - Measured Comic End & Single Long Image Completion", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollBy", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
    vi.stubGlobal("innerHeight", 1000);
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { configurable: true, value: 800 });
    Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", { configurable: true, value: 1200 });
    Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const singlePageProps = {
    sourceId: "src-webtoon",
    mangaId: "manga-webtoon",
    chapterId: "ch-webtoon-1",
    chapterTitle: "Chapter 1",
    pages: [{ index: 0, url: "http://example.com/long-webtoon-strip.jpg" }],
    chapters: [{ id: "ch-webtoon-1", title: "Chapter 1", mangaId: "manga-webtoon", number: 1, date: "2024-01-01T00:00:00.000Z" }],
  };

  it("does not complete single long image chapter when mounted at top (scrollY = 0) even after decode", async () => {
    // Container bottom is at 10000px, window height is 1000px -> user is at top
    const getBoundingClientRectSpy = vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 10000,
      left: 0,
      right: 800,
      width: 800,
      height: 10000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const { useHistoryStore } = await import("@/shared/store/history-store");
    useHistoryStore.setState({
      items: {
        "src-webtoon::manga-webtoon::ch-webtoon-1": {
          sourceId: "src-webtoon",
          mangaId: "manga-webtoon",
          chapterId: "ch-webtoon-1",
          mangaTitle: "Manga Webtoon",
          readAt: Date.now(),
          pageIndex: 0,
          totalPages: 1,
          progressPercent: 0,
        },
      },
    });

    const { getByRole } = render(<ContinuousVerticalReader {...singlePageProps} />);

    // Decode image
    const img = getByRole("img");
    await React.act(async () => {
      fireEvent.load(img);
    });

    const historyItem = useHistoryStore.getState().items["src-webtoon::manga-webtoon::ch-webtoon-1"];
    // MUST NOT be marked 100% because user hasn't scrolled to bottom of comic content
    expect(historyItem?.progressPercent).not.toBe(100);

    getBoundingClientRectSpy.mockRestore();
  });

  it("completes single long image chapter when user scrolls to bottom of comic content and image is decoded", async () => {
    let isAtBottom = false;
    const getBoundingClientRectSpy = vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockImplementation(() => {
      return {
        top: isAtBottom ? -9000 : 0,
        bottom: isAtBottom ? 800 : 10000,
        left: 0,
        right: 800,
        width: 800,
        height: 10000,
        x: 0,
        y: isAtBottom ? -9000 : 0,
        toJSON: () => {},
      };
    });

    const { useHistoryStore } = await import("@/shared/store/history-store");
    useHistoryStore.setState({
      items: {
        "src-webtoon::manga-webtoon::ch-webtoon-1": {
          sourceId: "src-webtoon",
          mangaId: "manga-webtoon",
          chapterId: "ch-webtoon-1",
          mangaTitle: "Manga Webtoon",
          readAt: Date.now(),
          pageIndex: 0,
          totalPages: 1,
          progressPercent: 0,
        },
      },
    });

    const { getByRole } = render(<ContinuousVerticalReader {...singlePageProps} />);

    // Decode image while at top
    const img = getByRole("img");
    await React.act(async () => {
      fireEvent.load(img);
    });

    // Verify still not completed at top
    expect(useHistoryStore.getState().items["src-webtoon::manga-webtoon::ch-webtoon-1"]?.progressPercent).not.toBe(100);

    // Now user scrolls to bottom of comic content
    isAtBottom = true;
    await React.act(async () => {
      fireEvent.scroll(window);
      await new Promise((r) => setTimeout(r, 50));
    });

    const historyItem = useHistoryStore.getState().items["src-webtoon::manga-webtoon::ch-webtoon-1"];
    expect(historyItem?.progressPercent).toBe(100);

    getBoundingClientRectSpy.mockRestore();
  });

  it("completes chapter when clicking explicit Detail Komik button even if user has not reached bottom", async () => {
    // At top of page
    const getBoundingClientRectSpy = vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 10000,
      left: 0,
      right: 800,
      width: 800,
      height: 10000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const { useHistoryStore } = await import("@/shared/store/history-store");
    useHistoryStore.setState({
      items: {
        "src-webtoon::manga-webtoon::ch-webtoon-1": {
          sourceId: "src-webtoon",
          mangaId: "manga-webtoon",
          chapterId: "ch-webtoon-1",
          mangaTitle: "Manga Webtoon",
          readAt: Date.now(),
          pageIndex: 0,
          totalPages: 1,
          progressPercent: 0,
        },
      },
    });

    const { getByRole, getByText } = render(<ContinuousVerticalReader {...singlePageProps} />);

    // Decode image
    const img = getByRole("img");
    await React.act(async () => {
      fireEvent.load(img);
    });

    const detailBtn = getByText("Detail Komik").closest("a");
    expect(detailBtn).toBeTruthy();
    await React.act(async () => {
      fireEvent.click(detailBtn!);
    });

    const historyItem = useHistoryStore.getState().items["src-webtoon::manga-webtoon::ch-webtoon-1"];
    expect(historyItem?.progressPercent).toBe(100);

    getBoundingClientRectSpy.mockRestore();
  });
});
