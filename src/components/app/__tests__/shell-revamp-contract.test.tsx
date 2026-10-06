import * as React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DesktopRail } from "../desktop-rail";
import { TopNav } from "../top-nav";
import { HomeHero } from "../home-hero";
import { SiteAnnouncementBanner } from "@/components/layout/site-announcement-banner";
import { useSidebarStore } from "@/shared/store/sidebar-store";
import fs from "node:fs";
import path from "node:path";

let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/use-mounted", () => ({
  useMounted: () => true,
}));

vi.mock("@/shared/store/history-store", () => ({
  useHistoryStore: () => false,
}));

vi.mock("@/components/app/updates-bell", () => ({
  UpdatesBell: () => <button type="button" aria-label="Pembaruan">Bell</button>,
}));

vi.mock("@/components/app/theme-toggle", () => ({
  ThemeToggle: () => <button type="button" aria-label="Ganti tema">Theme</button>,
}));

describe("Shell Revamp Regression Coverage", () => {
  beforeEach(() => {
    currentPathname = "/";
    sessionStorage.clear();
    act(() => {
      useSidebarStore.setState({ isCollapsed: false });
    });
  });

  describe("DesktopRail Minimize / Expand State & Semantics", () => {
    it("renders default expanded state with visible labels and expanded width class", () => {
      const { container } = render(<DesktopRail />);

      const aside = container.querySelector("aside");
      expect(aside).toBeTruthy();
      expect(aside?.className).toContain("xl:w-[240px]");
      expect(aside?.className).toContain("w-[76px]");

      // Toggle button should indicate expanded state
      const toggleBtn = screen.getByRole("button", { name: "Ciutkan bilah samping" });
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
      expect(toggleBtn.getAttribute("title")).toBe("Ciutkan bilah samping");
      expect(toggleBtn.className).toContain("focus-visible:ring-2");
    });

    it("restores compact preference correctly when store is collapsed", () => {
      act(() => {
        useSidebarStore.setState({ isCollapsed: true });
      });

      const { container } = render(<DesktopRail />);

      const aside = container.querySelector("aside");
      expect(aside).toBeTruthy();
      expect(aside?.className).toContain("w-[76px]");
      expect(aside?.className).not.toContain("xl:w-[240px]");

      // Toggle button should reflect collapsed state and offer expand
      const toggleBtn = screen.getByRole("button", { name: "Perluas bilah samping" });
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
      expect(toggleBtn.getAttribute("title")).toBe("Perluas bilah samping");
    });

    it("toggles state when the toggle button is clicked", () => {
      render(<DesktopRail />);

      const toggleBtn = screen.getByRole("button", { name: "Ciutkan bilah samping" });
      fireEvent.click(toggleBtn);

      expect(useSidebarStore.getState().isCollapsed).toBe(true);

      const expandBtn = screen.getByRole("button", { name: "Perluas bilah samping" });
      expect(expandBtn).toBeTruthy();
      expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
    });

    it("maintains active and pending navigation states in both modes", () => {
      currentPathname = "/library";
      const { rerender } = render(<DesktopRail />);

      const libraryLink = screen.getByRole("link", { name: "Library" });
      expect(libraryLink.getAttribute("aria-current")).toBe("page");

      // Switch to collapsed
      act(() => {
        useSidebarStore.setState({ isCollapsed: true });
      });
      rerender(<DesktopRail pendingHref="/popular" />);

      const populerLink = screen.getByRole("link", { name: "Populer" });
      expect(populerLink.getAttribute("aria-current")).toBe("page");
    });
  });

  describe("Tablet forced-compact behavior contract", () => {
    it("ensures DesktopRail keeps 76px compact base class and toggle is hidden on non-desktop", () => {
      const read = (file: string) =>
        fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      const railCode = read("src/components/app/desktop-rail.tsx");

      // Toggle container must be hidden on mobile/tablet (hidden xl:flex)
      expect(railCode).toContain("hidden xl:flex mt-auto");

      // Aside width must always have w-[76px] base for md-lg tablet viewports
      expect(railCode).toContain('w-[76px]');
    });

    it("aligns TopNav left offset with the sidebar compact and expanded states", () => {
      act(() => {
        useSidebarStore.setState({ isCollapsed: false });
      });
      const { rerender, container } = render(<TopNav />);

      const headerExpanded = container.querySelector("header");
      expect(headerExpanded?.className).toContain("xl:left-[240px]");
      expect(headerExpanded?.className).toContain("left-[76px]");

      act(() => {
        useSidebarStore.setState({ isCollapsed: true });
      });
      rerender(<TopNav />);

      const headerCollapsed = container.querySelector("header");
      expect(headerCollapsed?.className).toContain("left-[76px]");
      expect(headerCollapsed?.className).not.toContain("xl:left-[240px]");
    });
  });

  describe("SiteAnnouncementBanner Stacking & Navigation Offset", () => {
    it("sets and resets --announcement-height CSS variable without occluding shell", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          announcement: {
            enabled: true,
            message: "Pengumuman pembaruan sistem",
            type: "info",
            id: "ann-1",
          },
        }),
      });

      render(<SiteAnnouncementBanner />);
      await waitFor(() => {
        expect(screen.getByText("Pengumuman pembaruan sistem")).toBeTruthy();
      });

      const banner = screen.getByRole("complementary", { name: "Pengumuman Situs" });
      expect(banner.className).toContain("z-50");

      const closeBtn = screen.getByLabelText("Tutup pengumuman");
      fireEvent.click(closeBtn);

      expect(document.documentElement.style.getPropertyValue("--announcement-height")).toBe("0px");
    });
  });

  describe("HomeHero Responsive & Collision Free Contract", () => {
    it("does not use overlapping max-w-[78%] mobile width contract", () => {
      const read = (file: string) =>
        fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      const heroCode = read("src/components/app/home-hero.tsx");

      // Ensure max-w-[78%] is eliminated
      expect(heroCode).not.toContain("max-w-[78%]");

      // Collage container uses gradient mask to ensure safe text layering on mobile and desktop
      expect(heroCode).toContain("maskImage");
      expect(heroCode).toContain("pointer-events-none");
    });

    it("renders headline and full-width search input cleanly", () => {
      render(<HomeHero />);

      const heading = screen.getByRole("heading", { level: 1, name: "Mau baca apa hari ini?" });
      expect(heading).toBeTruthy();

      const searchInput = screen.getByPlaceholderText(/Cari judul atau kreator/i);
      expect(searchInput).toBeTruthy();
    });
  });
});
