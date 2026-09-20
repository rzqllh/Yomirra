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
