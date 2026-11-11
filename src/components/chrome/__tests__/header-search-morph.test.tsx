import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { PageHeader } from "@/components/chrome/header";
import { TopNav } from "@/components/chrome/top-nav";

let mockPathname = "/";
let observerCallbacks: ((entries: IntersectionObserverEntry[]) => void)[] = [];

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
  }

  observe = vi.fn();
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
    mockPathname = "/";
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
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
      expect(screen.getByRole("heading", { level: 2, name: "Beranda" })).toBeTruthy();
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
      triggerIntersection(anchor, false, 20);

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

    it("always shows search pill on non-home pages (e.g. /popular)", () => {
      mockPathname = "/popular";
      const { unmount } = render(<TopNav />);

      expect(screen.getByRole("button", { name: /Cari komik/i })).toBeTruthy();
      unmount();
    });
  });
});
