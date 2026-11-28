import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, act, cleanup, within } from "@testing-library/react";
import { DestinationHeader, PageHeader } from "@/components/chrome/header";
import { TopNav } from "@/components/chrome/top-nav";

let mockPathname = "/";
let observerCallbacks: ((entries: IntersectionObserverEntry[]) => void)[] = [];
let observerMargins: string[] = [];
const observeIntersection = vi.fn<(target: Element) => void>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/shared/hooks/use-mounted", () => ({
  useMounted: () => true,
}));

vi.mock("@/components/overlays/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("@/components/overlays/updates-bell", () => ({
  UpdatesBell: () => <div data-testid="updates-bell" />,
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: (entries: IntersectionObserverEntry[]) => void;

  constructor(callback: (entries: IntersectionObserverEntry[]) => void, options?: IntersectionObserverInit) {
    this.callback = callback;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    observerCallbacks.push(callback);
    observerMargins.push(this.rootMargin);
  }

  observe = observeIntersection;
  unobserve = vi.fn();
  disconnect = vi.fn(() => {
    observerCallbacks = observerCallbacks.filter((cb) => cb !== this.callback);
  });
  takeRecords = vi.fn(() => []);
}

function triggerIntersection(target: HTMLElement, isIntersecting: boolean, top: number) {
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 40,
    left: 0,
    right: 300,
    width: 300,
    height: 40,
    x: 0,
    y: top,
    toJSON: () => {},
  });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    for (const cb of [...observerCallbacks]) {
      cb([
        {
          target,
          isIntersecting,
          boundingClientRect: { top, bottom: top + 40, left: 0, right: 300, width: 300, height: 40 } as DOMRectReadOnly,
          intersectionRatio: isIntersecting ? 1 : 0,
          time: Date.now(),
          rootBounds: null,
          intersectionRect: {} as DOMRectReadOnly,
        },
      ]);
    }
  });
}

describe("Header Search Morphing & Sticky Interaction Contract", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
    observerCallbacks = [];
    observerMargins = [];
    mockPathname = "/";
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe("PageHeader (Mobile)", () => {
    it("renders default title when hero search anchor is intersecting or before scroll", () => {
      const anchor = document.createElement("div");
      anchor.id = "home-hero-search";
      document.body.appendChild(anchor);

      const { unmount } = render(
        <PageHeader
          title="Beranda"
          heroSearchAnchorId="home-hero-search"
          actions={<div data-testid="mobile-actions">Actions</div>}
          hideDesktop
        />
      );

      // Title should be visible
      expect(screen.getByRole("heading", { level: 1, name: "Beranda" })).toBeTruthy();
      expect(screen.getByTestId("mobile-actions")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Cari komik" })).toBeNull();

      unmount();
    });

    it("morphs title into search pill when hero search scrolls past the header while preserving actions", () => {
      window.scrollY = 150;
      const anchor = document.createElement("div");
      anchor.id = "home-hero-search";
      document.body.appendChild(anchor);

      const { unmount } = render(
        <PageHeader
          title="Beranda"
          heroSearchAnchorId="home-hero-search"
          actions={<div data-testid="mobile-actions">Actions</div>}
          hideDesktop
        />
      );

      // Trigger IntersectionObserver entry: anchor scrolled above 56px boundary
      expect(observerCallbacks.length).toBeGreaterThan(0);
      expect(observerMargins).toEqual(["-56px 0px 0px 0px"]);
      triggerIntersection(anchor, false, 10);

      // Search pill should now appear in the header
      const searchButton = screen.getByRole("button", { name: "Cari komik" });
      expect(searchButton).toBeTruthy();
      expect(searchButton.textContent).toContain("Cari komik…");

      // Right action elements (Bell / Profile) remain in place
      expect(screen.getByTestId("mobile-actions")).toBeTruthy();

      // Clicking search pill dispatches open-command-menu event
      const listener = vi.fn();
      window.addEventListener("open-command-menu", listener);
      fireEvent.click(searchButton);
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener("open-command-menu", listener);

      unmount();
    });
  });

  describe("TopNav (Desktop)", () => {
    it("hides search pill on home page when hero search is within viewport and shows it when scrolled past", () => {
      mockPathname = "/";
      window.scrollY = 0;
      const anchor = document.createElement("div");
      anchor.id = "home-hero-search";
      document.body.appendChild(anchor);

      const { unmount } = render(<TopNav />);

      // On home at top, search pill is hidden
      expect(screen.queryByRole("button", { name: /Cari komik/i })).toBeNull();

      // Trigger IntersectionObserver: anchor is scrolled past the top-nav header (bottom < 68px)
      window.scrollY = 150;
      expect(observerCallbacks.length).toBeGreaterThan(0);
      triggerIntersection(anchor, false, 10);

      // Search pill should now appear
      const searchButton = screen.getByRole("button", { name: /Cari komik/i });
      expect(searchButton).toBeTruthy();
      expect(searchButton.textContent).toContain("Cari komik…");

      unmount();
    });

    it("observes the Home hero when it mounts after the shell", async () => {
      render(<TopNav />);
      const anchor = document.createElement("div");
      anchor.id = "home-hero-search";

      expect(observeIntersection).not.toHaveBeenCalled();
      await act(async () => { document.body.appendChild(anchor); });
      expect(observeIntersection).toHaveBeenCalledWith(anchor);
      triggerIntersection(anchor, false, 10);

      expect(screen.getByRole("button", { name: /Cari komik/i })).toBeTruthy();
    });

    it("remeasures the desktop boundary when an announcement shifts TopNav and when its top transition ends", async () => {
      let headerBottom = 68;
      const rootStyle = document.documentElement.style;
      const previousHeight = rootStyle.getPropertyValue("--announcement-height");
      const anchor = document.createElement("div");
      anchor.id = "home-hero-search";
      document.body.appendChild(anchor);
      const { unmount } = render(<TopNav />);
      const header = screen.getByRole("banner");
      vi.spyOn(header, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, headerBottom - 68, 500, 68));

      try {
        expect(observerMargins).toEqual(["-68px 0px 0px 0px"]);
        triggerIntersection(anchor, true, 40);
        expect(screen.queryByRole("button", { name: /Cari komik/i })).toBeNull();

        await act(async () => {
          headerBottom = 108;
          rootStyle.setProperty("--announcement-height", "40px");
        });
        expect(observerMargins).toEqual(["-68px 0px 0px 0px", "-108px 0px 0px 0px"]);
        expect(observerCallbacks).toHaveLength(1);
        triggerIntersection(anchor, false, 40);
        expect(screen.getByRole("button", { name: /Cari komik/i })).toBeTruthy();

        await act(async () => { rootStyle.setProperty("--announcement-height", "0px"); });
        headerBottom = 68;
        const transitionEnd = Object.assign(new Event("transitionend"), { propertyName: "top" });
        fireEvent(header, transitionEnd);
        expect(observerMargins).toEqual(["-68px 0px 0px 0px", "-108px 0px 0px 0px", "-68px 0px 0px 0px"]);
        triggerIntersection(anchor, true, 40);
        expect(screen.queryByRole("button", { name: /Cari komik/i })).toBeNull();
      } finally {
        unmount();
        rootStyle.setProperty("--announcement-height", previousHeight);
      }
    });

    it("remeasures TopNav when its border box resizes and disconnects on unmount", () => {
      const observe = vi.fn();
      const disconnect = vi.fn();
      let onResize: () => void = () => {};
      vi.stubGlobal("ResizeObserver", class {
        constructor(callback: () => void) { onResize = callback; }
        observe = observe;
        disconnect = disconnect;
      });
      const { unmount } = render(<TopNav />);
      const header = screen.getByRole("banner");
      expect(observe).toHaveBeenCalledWith(header, { box: "border-box" });
      vi.spyOn(header, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 500, 76));
      act(onResize);
      expect(observerMargins[observerMargins.length - 1]).toBe("-76px 0px 0px 0px");
      expect(observerCallbacks).toHaveLength(1);

      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
      expect(observerCallbacks).toHaveLength(0);
    });

    it("updates the search control and breadcrumb on route transitions", () => {
      mockPathname = "/library";
      const { rerender } = render(<TopNav />);
      expect(screen.getByRole("button", { name: /Cari komik/i })).toBeTruthy();

      mockPathname = "/search";
      rerender(<TopNav />);
      expect(screen.queryByRole("button", { name: /Cari komik/i })).toBeNull();

      mockPathname = "/sources/example";
      rerender(<TopNav />);
      const breadcrumb = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
      expect(breadcrumb.getByRole("link", { name: "Sumber" }).getAttribute("href")).toBe("/sources");
      expect(breadcrumb.getByText("Katalog sumber").getAttribute("aria-current")).toBe("page");

      mockPathname = "/";
      rerender(<TopNav />);
      expect(screen.queryByRole("button", { name: /Cari komik/i })).toBeNull();
    });

    it.each([
      ["/updates", "Jadwal Mingguan"],
      ["/help", "Pusat Bantuan"],
      ["/catalog", "Katalog"],
      ["/manga/example/example", "Komik"],
    ])("localizes the breadcrumb at %s", (pathname, label) => {
      mockPathname = pathname;
      render(<TopNav />);
      expect(screen.getByText(label).getAttribute("aria-current")).toBe("page");
    });

    it("always shows search pill on non-home pages (e.g. /popular)", () => {
      mockPathname = "/popular";
      const { unmount } = render(<TopNav />);

      expect(screen.getByRole("button", { name: /Cari komik/i })).toBeTruthy();
      unmount();
    });
  });

  it("keeps compact desktop actions and lets a content hero own the H1", () => {
    render(
      <>
        <DestinationHeader
          destination="account"
          headingOwner="content"
          desktopActions={<button type="button">Sinkronkan</button>}
        />
        <h1>Akun & Sinkronisasi</h1>
      </>
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const actions = screen.getByRole("button", { name: "Sinkronkan" }).parentElement?.parentElement;
    expect(actions?.classList.contains("md:flex")).toBe(true);
    expect(within(actions!).getByRole("button", { name: "Kembali" })).toBeTruthy();
  });
});
