import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { ReaderShell } from "../reader-shell";
import { useReaderStore } from "@/shared/store/reader-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { toast } from "sonner";
import { noteCompletedChapter } from "@/shared/lib/bookmark-suggestion";
import { beginNavigationIntent, commitNavigationParent, endNavigationIntent } from "@/shared/lib/navigation-intent";
import { getReaderChapterHref } from "../reader-navigation";

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
    Object.defineProperty(window,"scrollY",{value:0,writable:true,configurable:true});
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

  it("uses a dark contrast scope for dark reader chrome", () => {
    const { container } = render(
      <ReaderShell sourceId="srcA" mangaId="m1"><div>Content</div></ReaderShell>
    );
    expect(container.querySelector(".reader-contrast-scope.dark")).not.toBeNull();
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

  it("returns to the saved entry after replacing the reader chapter", () => {
    const savedHref = "/catalog/saved/saved%3A%3Atitle";
    const returnQuery = "?returnTo=%2Fcatalog%2Fsaved%2Fsaved%253A%253Atitle";
    const readerHref = `/manga/srcA/m1/read/ch-1${returnQuery}`;
    window.history.replaceState({}, "", savedHref);
    beginNavigationIntent(readerHref);
    window.history.pushState({}, "", readerHref);
    commitNavigationParent();
    endNavigationIntent();

    const nextHref = getReaderChapterHref("srcA", "m1", "ch-2");
    expect(nextHref).toBe(`/manga/srcA/m1/read/ch-2${returnQuery}`);
    beginNavigationIntent(nextHref, "replace");
    window.history.replaceState({}, "", nextHref);
    commitNavigationParent();

    render(<ReaderShell sourceId="srcA" mangaId="m1"><div>Content</div></ReaderShell>);
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke detail komik" }));
    expect(mockRouterBack).toHaveBeenCalledOnce();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("uses source detail when a direct reader link merely names a saved entry", () => {
    const returnQuery = "?returnTo=%2Fcatalog%2Fsaved%2Fdirect-title";
    window.history.replaceState({}, "", `/manga/srcA/m1/read/ch-1${returnQuery}`);

    render(<ReaderShell sourceId="srcA" mangaId="m1"><div>Content</div></ReaderShell>);
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke detail komik" }));
    expect(mockRouterBack).not.toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith(`/manga/srcA/m1${returnQuery}`);
  });

  it("offers a bookmark once after four completed chapters and never toggles an existing save off", () => {
    const prompt = vi.spyOn(toast, "info");
    for (const chapter of ["1", "2", "3", "4"]) noteCompletedChapter("srcA", "m1", chapter);
    render(<ReaderShell sourceId="srcA" mangaId="m1" mangaTitle="Saved work"><div>Content</div></ReaderShell>);
    const options = prompt.mock.calls.find(([title]) => title === "Simpan bacaan ini ke Library?")?.[1];
    expect(options?.action).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Simpan ke Library" }));
    const action = options!.action as { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void };
    action.onClick({} as React.MouseEvent<HTMLButtonElement>);
    expect(useLibraryStore.getState().isInLibrary("srcA", "m1")).toBe(true);
    prompt.mockRestore();
  });

  it("uses Library terminology for both save and remove feedback", () => {
    const savedToast = vi.spyOn(toast, "success");
    const removedToast = vi.spyOn(toast, "info");

    render(
      <ReaderShell sourceId="srcA" mangaId="m1" mangaTitle="Judul uji">
        <div>Konten</div>
      </ReaderShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan ke Library" }));
    expect(savedToast).toHaveBeenCalledWith("Disimpan ke Library", expect.any(Object));
    fireEvent.click(screen.getByRole("button", { name: "Hapus dari Library" }));
    expect(removedToast).toHaveBeenCalledWith("Dihapus dari Library", expect.any(Object));

    savedToast.mockRestore();
    removedToast.mockRestore();
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

  it("renders continuous 0-100% progress scrubber without page dots for webtoon continuous mode", () => {
    const mockSeekProgress = vi.fn();
    useReaderStore.setState({
      pageNavigation: {
        key: "srcA::m1::ch1",
        index: 1,
        total: 20,
        seek: vi.fn(),
        mode: "continuous",
        progress: 42,
        seekProgress: mockSeekProgress,
      },
    });

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

    expect(screen.queryByTestId("reader-page-dots")).toBeNull();
    const scrubber = screen.getByRole("slider", { name: "Posisi baca" });
    expect(scrubber).toBeDefined();
    expect(scrubber.getAttribute("value")).toBe("42");
    expect(scrubber.getAttribute("aria-valuetext")).toBe("42%");

    fireEvent.change(scrubber, { target: { value: "75" } });
    expect(mockSeekProgress).toHaveBeenCalledWith(75);
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

    const bookmarkBtn = screen.getByLabelText("Simpan ke Library");
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

  it("does not auto-hide reader overlay when scrolling is triggered by active scrubbing", () => {
    useReaderStore.setState({ isOverlayVisible: true });

    render(
      <ReaderShell
        mangaTitle="Solo Leveling"
        chapterTitle="Chapter 1"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div style={{ height: "4000px" }}>Content</div>
      </ReaderShell>
    );

    const scrubber = screen.getByRole("slider", { name: "Pindah halaman" });
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);

    // User starts scrubbing
    fireEvent.pointerDown(scrubber);

    // Scroll down event fires as seek updates scroll position
    Object.defineProperty(window, "scrollY", { value: 600, writable: true });
    fireEvent.scroll(window);

    // Overlay must remain visible while scrubbing
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);

    // User ends scrubbing
    fireEvent.pointerUp(scrubber);
    // Still protected by grace period
    fireEvent.scroll(window);
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);
  });

  it("renders symmetrical true-center header with proper title tooltips and consistent buttons", () => {
    const { container } = render(
      <ReaderShell
        mangaTitle="Frieren: Beyond Journey's End"
        chapterTitle="Chapter 123 - The Hero's Blade"
        currentChapterId="ch1"
        sourceId="srcA"
        mangaId="m1"
      >
        <div>Content</div>
      </ReaderShell>
    );

    const header = container.querySelector("header");
    expect(header).toBeDefined();
    expect(header?.className).toContain("grid-cols-[92px_minmax(0,1fr)_92px]");
    expect(header?.classList.contains("shadow-none")).toBe(true);
    expect(header?.classList.contains("shadow-lg")).toBe(false);

    // Left cluster buttons
    expect(screen.getByRole("button", { name: "Kembali ke detail komik" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Kembali ke Beranda" })).toBeDefined();

    // Right cluster button
    expect(screen.getByRole("button", { name: "Simpan ke Library" })).toBeDefined();

    // Center title and chapter tooltips
    const mangaTitleEl = screen.getByText("Frieren: Beyond Journey's End");
    const chapterTitleEl = screen.getByText("Chapter 123 - The Hero's Blade");
    expect(mangaTitleEl.getAttribute("title")).toBe("Frieren: Beyond Journey's End");
    expect(chapterTitleEl.getAttribute("title")).toBe("Chapter 123 - The Hero's Blade");
  });

  it("keeps opaque contrast surfaces and exposes bookmark state in both reader backgrounds",()=>{
  useReaderStore.setState({preferences:{...useReaderStore.getState().preferences,background:"mist"},isOverlayVisible:true});
  const {container}=render(<ReaderShell sourceId="contrast-fixture" mangaId="work" currentChapterId="chapter"><div>Content</div></ReaderShell>);
  expect(container.querySelector(".reader-contrast-scope.light")).not.toBeNull();
  expect(container.querySelector("header")?.classList.contains("reader-chrome-surface")).toBe(true);
  expect(screen.getByRole("group",{name:"Kontrol pembaca"}).classList.contains("reader-chrome-surface")).toBe(true);
  const saved=screen.getByRole("button",{name:"Simpan ke Library"});
  expect(saved.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(saved);
  expect(screen.getByRole("button",{name:"Hapus dari Library"}).getAttribute("aria-pressed")).toBe("true");
});

  it("scroll in either direction hides without re-showing; explicit keyboard intent restores",async()=>{
    render(<ReaderShell sourceId="srcA" mangaId="m1" currentChapterId="ch1"><div>Page</div></ReaderShell>);
    Object.defineProperty(window,"scrollY",{value:300,writable:true,configurable:true});fireEvent.scroll(window);
    await waitFor(()=>expect(useReaderStore.getState().isOverlayVisible).toBe(false));
    Object.defineProperty(window,"scrollY",{value:0,writable:true,configurable:true});fireEvent.scroll(window);
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,60));});
    expect(useReaderStore.getState().isOverlayVisible).toBe(false);
    fireEvent.keyDown(window,{key:"m"});
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);
  });
  it("explicit show intent cancels an already queued scroll hide",async()=>{
    render(<ReaderShell sourceId="srcA" mangaId="m1" currentChapterId="ch1"><div>Page</div></ReaderShell>);
    act(()=>useReaderStore.getState().setOverlayVisible(false));
    Object.defineProperty(window,"scrollY",{value:300,writable:true,configurable:true});
    fireEvent.scroll(window);
    fireEvent.keyDown(window,{key:"m"});
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,60));});
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);
    Object.defineProperty(window,"scrollY",{value:450,writable:true,configurable:true});
    fireEvent.scroll(window);
    await waitFor(()=>expect(useReaderStore.getState().isOverlayVisible).toBe(false));
  });
  it("end card suppresses only dock and badge, never forces header state",async()=>{
    let atEnd=true;
    const box={x:0,y:0,width:200,height:200,top:0,right:200,bottom:200,left:0,toJSON:()=>({})};
    const original=HTMLElement.prototype.getBoundingClientRect;
    const spy=vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockImplementation(function(this:HTMLElement){
      if(this.hasAttribute("data-reader-end-controls"))return {...box,top:atEnd?0:window.innerHeight+100,bottom:atEnd?200:window.innerHeight+300};
      return original.call(this);
    });
    try{
      render(<ReaderShell sourceId="srcA" mangaId="m1" currentChapterId="ch1"><div data-reader-end-controls>End chapter</div></ReaderShell>);
      expect(screen.getByRole("button",{name:"Kembali ke detail komik"})).toBeDefined();
      expect(screen.queryByRole("group",{name:"Kontrol pembaca"})).toBeNull();
      expect(screen.queryByTestId("reader-page-scrubber")).toBeNull();
      fireEvent.keyDown(window,{key:"m"});
      expect(useReaderStore.getState().isOverlayVisible).toBe(false);
      fireEvent.keyDown(window,{key:"m"});
      expect(useReaderStore.getState().isOverlayVisible).toBe(true);
      expect(screen.queryByRole("group",{name:"Kontrol pembaca"})).toBeNull();
      atEnd=false;fireEvent.resize(window);
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,60));});
      expect(screen.queryByRole("group",{name:"Kontrol pembaca"})).toBeNull();
      fireEvent.keyDown(window,{key:"m"});fireEvent.keyDown(window,{key:"m"});
      await waitFor(()=>expect(screen.getByRole("group",{name:"Kontrol pembaca"})).toBeDefined());
    }finally{spy.mockRestore();}
  });

  it("restores dock immediately upon leaving the end card when toolbarBehavior is always-visible",async()=>{
    useReaderStore.setState({
      preferences:{...useReaderStore.getState().preferences,toolbarBehavior:"always-visible"},
      isOverlayVisible:true,
    });
    let atEnd=true;
    const box={x:0,y:0,width:200,height:200,top:0,right:200,bottom:200,left:0,toJSON:()=>({})};
    const original=HTMLElement.prototype.getBoundingClientRect;
    const spy=vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockImplementation(function(this:HTMLElement){
      if(this.hasAttribute("data-reader-end-controls"))return {...box,top:atEnd?0:window.innerHeight+100,bottom:atEnd?200:window.innerHeight+300};
      return original.call(this);
    });
    try{
      render(<ReaderShell sourceId="srcA" mangaId="m1" currentChapterId="ch1"><div data-reader-end-controls>End chapter</div></ReaderShell>);
      expect(screen.queryByRole("group",{name:"Kontrol pembaca"})).toBeNull();
      atEnd=false;
      fireEvent.resize(window);
      await waitFor(()=>expect(screen.getByRole("group",{name:"Kontrol pembaca"})).toBeDefined());
    }finally{spy.mockRestore();}
  });
});
