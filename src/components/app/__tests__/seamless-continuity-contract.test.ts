import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculateSearchMorphProgress,
  type SearchSlotGeometry,
} from "@/shared/lib/motion/search-morph-math";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("Seamless Continuity Contracts (WS5)", () => {
  describe("Pure Math Search Morph Progress (WS1 Contract)", () => {
    const slot: SearchSlotGeometry = {
      top: 240,
      left: 100,
      width: 600,
      height: 52,
      borderRadius: 16,
    };

    const target: SearchSlotGeometry = {
      top: 14,
      left: 400,
      width: 224,
      height: 36,
      borderRadius: 9999,
    };

    it("evaluates exactly to p = 0 and slot geometry at scrollY = 0", () => {
      const result = calculateSearchMorphProgress(slot, target, 0);

      expect(result.progress).toBe(0);
      expect(result.y).toBe(240);
      expect(result.x).toBe(100);
      expect(result.width).toBe(600);
      expect(result.height).toBe(52);
      expect(result.borderRadius).toBe(16);
    });

    it("evaluates to continuous intermediate values at half-way scroll", () => {
      const halfDelta = (slot.top - target.top) / 2; // (240 - 14) / 2 = 113
      const result = calculateSearchMorphProgress(slot, target, halfDelta);

      expect(result.progress).toBeCloseTo(0.5, 4);
      expect(result.y).toBe(240 - halfDelta);
      expect(result.width).toBeCloseTo(412, 1);
      expect(result.height).toBeCloseTo(44, 1);
    });

    it("evaluates exactly to p = 1 and docked target geometry when scrolled past deltaY", () => {
      const deltaY = slot.top - target.top; // 226
      const result = calculateSearchMorphProgress(slot, target, deltaY + 50);

      expect(result.progress).toBe(1);
      expect(result.y).toBe(target.top);
      expect(result.x).toBe(target.left);
      expect(result.width).toBe(target.width);
      expect(result.height).toBe(target.height);
      expect(result.borderRadius).toBe(target.borderRadius);
    });

    it("safely handles unmeasured or zero deltaY by docking to target (p = 1)", () => {
      const invalidSlot: SearchSlotGeometry = { ...slot, top: 10 };
      const result = calculateSearchMorphProgress(invalidSlot, target, 0);

      expect(result.progress).toBe(1);
      expect(result.y).toBe(target.top);
    });
  });

  describe("Navigation & History Stack Contracts (WS3 Contract)", () => {
    it("ensures ChapterRow and Mulai Baca use push navigation and trigger navigation intent", () => {
      const chapterRow = read("src/components/komik/chapter-row.tsx");
      const detailView = read("src/components/komik/manga-detail-view.tsx");

      // Entry points from detail must NOT use replace, they must use push and beginNavigationIntent
      expect(chapterRow).not.toMatch(/<Link[\s\S]*?replace[\s\S]*?aria-label/);
      expect(chapterRow).toContain("beginNavigationIntent(readerHref)");

      expect(detailView).not.toMatch(/<Link[\s\S]*?replace[\s\S]*?aria-label/);
      expect(detailView).toContain("beginNavigationIntent(targetHref)");
    });

    it("ensures intra-reader chapter-to-chapter navigation uses replace to avoid history pollution", () => {
      const readerShell = read("src/components/reader/reader-shell.tsx");
      const pagedReader = read("src/components/reader/paged-reader.tsx");
      const verticalReader = read("src/components/reader/continuous-vertical-reader.tsx");

      expect(readerShell).toContain("router.replace(href)");
      expect(pagedReader).toContain("router.replace(href)");
      expect(verticalReader).toContain("router.replace(href)");
    });

    it("ensures reader in-app back returns via router.back() to restore detail scroll and highlighted state", () => {
      const readerShell = read("src/components/reader/reader-shell.tsx");
      expect(readerShell).toContain("router.back()");
      expect(readerShell).toContain("beginNavigationIntent(href)");
    });
  });

  describe("Reader Unified Loading & Single Skeleton Contract (WS3 Contract)", () => {
    it("ensures ReaderImage contains zero spinning loader circles (animate-spin removed)", () => {
      const readerImage = read("src/components/reader/reader-image.tsx");
      expect(readerImage).not.toContain("animate-spin");
      expect(readerImage).toContain("aspectRatio");
    });

    it("ensures ReaderShell renders real chapterTitle rather than hardcoded 'Loading...'", () => {
      const readerView = read("src/components/reader/reader-view.tsx");
      expect(readerView).not.toContain('chapterTitle="Loading..."');
      expect(readerView).toContain("chapterTitle={chapterTitle}");
    });
  });

  describe("Continuity Pairs & Focus Ring Damping (WS2 Contract)", () => {
    it("ensures DesktopRail damps mouse focus rings via onPointerDown blur and active:ring-0", () => {
      const desktopRail = read("src/components/chrome/desktop-rail.tsx");
      expect(desktopRail).toContain("active:ring-0");
      expect(desktopRail).toContain("e.currentTarget.blur()");
    });

    it("ensures PageHeader supports both desktop and mobile title anchors for crossfade", () => {
      const header = read("src/components/chrome/header.tsx");
      expect(header).toContain("manga-detail-title-desktop");
      expect(header).toContain("detailTitleAnchorId");
    });
  });

  describe("Editorial Spotlight Empty State & Fixed Height Contract (WS4 Contract)", () => {
    it("ensures EditorialSpotlight maintains fixed height and avoids placeholder string", () => {
      const spotlight = read("src/components/home/editorial-spotlight.tsx");
      expect(spotlight).toContain("h-[268px] min-w-0 overflow-hidden sm:h-[310px] lg:h-[340px]");
      expect(spotlight).not.toContain("Sinopsis belum tersedia");
      expect(spotlight).toContain("SpotlightMetadataFallback");
      expect(spotlight).toContain('data-spotlight-slot="synopsis-absent"');
    });
  });

  describe("TopNav Sticky Search & Hero Search Contract (WS1/WS5)", () => {
    it("renders hero search trigger natively in home hero and sticky search pill in TopNav", () => {
      const topNav = read("src/components/chrome/top-nav.tsx");
      const homeHero = read("src/components/home/home-hero.tsx");
      expect(topNav).toContain("scrolledPastHero");
      expect(homeHero).toContain('id="home-hero-search"');
      expect(homeHero).toContain('role="search"');
    });
  });
});
