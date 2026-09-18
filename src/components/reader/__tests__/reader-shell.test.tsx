import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReaderShell } from "../reader-shell";
import { useReaderStore } from "@/shared/store/reader-store";
import { useLibraryStore } from "@/shared/store/library-store";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() })),
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

vi.mock("motion/react", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: { get: () => 0.5 } }),
    useSpring: (val: any) => val,
  };
});

describe("ReaderShell Header & Progress Bar", () => {
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
        readingMode: "vertical",
        keepScreenAwake: true,
      },
      isOverlayVisible: true,
      isDesktopPanelOpen: true,
      pagedProgress: 0.25,
    });
    useLibraryStore.setState({ items: {} });
  });

  it("renders manga title on the top line and chapter title on the bottom line", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 179"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.getByText("Solo Leveling")).toBeDefined();
    expect(screen.getByText("Chapter 179")).toBeDefined();
  });

  it("falls back to chapterTitle when mangaTitle is undefined", () => {
    render(
      <ReaderShell
        chapterTitle="Chapter 0"
        pageCount={17}
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.getByText("Chapter 0")).toBeDefined();
    expect(screen.getByText("17 halaman")).toBeDefined();
  });

  it("renders start-to-finish reading progress bar inside the header capsule", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    const progressBar = screen.getByTestId("reader-progress-bar");
    expect(progressBar).toBeDefined();
  });

  it("saves bookmark using mangaTitle", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    const bookmarkBtn = screen.getByLabelText("Simpan ke bookmark");
    fireEvent.click(bookmarkBtn);

    const saved = useLibraryStore.getState().isInLibrary("srcA", "m1");
    expect(saved).toBe(true);

    const item = useLibraryStore.getState().getLibraryItem("srcA", "m1");
    expect(item?.title).toBe("Solo Leveling");
  });

  it("renders top-viewport progress bar when header is hidden", () => {
    useReaderStore.setState({ isOverlayVisible: false });

    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    // Header capsule is hidden
    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();

    // Top viewport bar is rendered
    const topBar = screen.getByTestId("top-viewport-progress-bar");
    expect(topBar).toBeDefined();
  });

  it("hides both progress bars when showPageProgress is disabled", () => {
    useReaderStore.setState({
      preferences: {
        imageFit: "width",
        pageGap: "none",
        background: "black",
        toolbarBehavior: "auto-hide",
        preloadIntensity: "balanced",
        showPageProgress: false,
        readingDirection: "ltr",
        readingMode: "vertical",
        keepScreenAwake: true,
      },
      isOverlayVisible: true,
    });

    const { rerender } = render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();
    expect(screen.queryByTestId("top-viewport-progress-bar")).toBeNull();

    // When overlay is hidden with showPageProgress false
    useReaderStore.setState({ isOverlayVisible: false });
    rerender(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();
    expect(screen.queryByTestId("top-viewport-progress-bar")).toBeNull();
  });
});
