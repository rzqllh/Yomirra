import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReaderShell } from "../reader-shell";
import { useReaderStore } from "@/shared/store/reader-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { toast } from "sonner";
import { noteCompletedChapter } from "@/shared/lib/bookmark-suggestion";
import { endNavigationIntent } from "@/shared/lib/navigation-intent";

const mockRouterBack = vi.fn();
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    back: mockRouterBack,
    push: mockRouterPush,
    replace: mockRouterReplace,
  })),
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
    sessionStorage.clear();
    endNavigationIntent();
    window.history.replaceState({}, "", "/");
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
      pageNavigation: { key: "srcA::m1::ch1", index: 1, total: 4, seek: vi.fn() },
    });
    useLibraryStore.setState({ items: {} });
  });

  it("returns to detail with the logical parent without pushing a reader route behind it", () => {
    window.history.replaceState(
      {},
      "",
      "/manga/srcA/m1/read/ch-1?returnTo=%2Flibrary%3Fsource%3DsrcA"
    );

    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Kembali ke detail komik" })
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/manga/srcA/m1?returnTo=%2Flibrary%3Fsource%3DsrcA"
    );
  });

  it("returns to detail even when browser history contains another Reader chapter", () => {
    window.history.pushState({}, "", "/manga/srcA/m1/read/ch-2");
    render(<ReaderShell sourceId="srcA" mangaId="m1"><div>Content</div></ReaderShell>);
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke detail komik" }));
    expect(mockRouterBack).not.toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith("/manga/srcA/m1");
  });

  it("offers a bookmark once after four completed chapters and never toggles an existing save off", () => {
    const prompt = vi.spyOn(toast, "info");
    for (const chapter of ["1", "2", "3", "4"]) noteCompletedChapter("srcA", "m1", chapter);
    render(<ReaderShell sourceId="srcA" mangaId="m1" mangaTitle="Saved work"><div>Content</div></ReaderShell>);
    const options = prompt.mock.calls.find(([title]) => title === "Simpan bacaan ini ke Library?")?.[1];
    expect(options?.action).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Simpan ke bookmark" }));
    const action = options!.action as { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void };
    action.onClick({} as React.MouseEvent<HTMLButtonElement>);
    expect(useLibraryStore.getState().isInLibrary("srcA", "m1")).toBe(true);
    prompt.mockRestore();
  });

  it("opens Home independently of the detail destination", () => {
    render(<ReaderShell sourceId="srcA" mangaId="m1"><div>Content</div></ReaderShell>);
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke Beranda" }));
    expect(mockRouterReplace).toHaveBeenCalledWith("/");
  });

  it("renders manga title on the top line and chapter title on the bottom line", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 179"
        currentChapterId="ch1"
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
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.getByText("Chapter 0")).toBeDefined();
    expect(screen.getByText("17 halaman")).toBeDefined();
  });

  it("renders page dots and an operable bottom scrubber", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.getByTestId("reader-page-dots").querySelectorAll("circle")).toHaveLength(4);
    const scrubber = screen.getByRole("slider", { name: "Pindah halaman" });
    fireEvent.change(scrubber, { target: { value: "4" } });
    expect(useReaderStore.getState().pageNavigation?.seek).toHaveBeenCalledWith(3);
  });

  it("saves bookmark using mangaTitle", () => {
    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
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

  it("keeps the bottom page scrubber when chrome is hidden", () => {
    useReaderStore.setState({ isOverlayVisible: false });

    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    // Header capsule is hidden
    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();

    // Top viewport bar is rendered
    const topBar = screen.getByTestId("reader-page-scrubber");
    expect(topBar).toBeDefined();
  });

  it("hides the scrubber when page progress is disabled", () => {
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
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();
    expect(screen.queryByTestId("top-viewport-progress-bar")).toBeNull();
    expect(screen.queryByTestId("reader-page-scrubber")).toBeNull();

    // When overlay is hidden with showPageProgress false
    useReaderStore.setState({ isOverlayVisible: false });
    rerender(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    expect(screen.queryByTestId("reader-progress-bar")).toBeNull();
    expect(screen.queryByTestId("top-viewport-progress-bar")).toBeNull();
    expect(screen.queryByTestId("reader-page-scrubber")).toBeNull();
  });
});
