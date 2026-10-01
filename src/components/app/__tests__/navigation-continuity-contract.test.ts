import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("navigation continuity contracts", () => {
  it("keeps optimistic pending state but delays visible feedback", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).toContain("setPendingHref(customEvent.detail.href)");
    expect(shell).toContain("useDelayedFlag(");
    expect(shell).toContain("navigationTiming.feedbackDelayMs");
    expect(shell).toContain("showNavigationProgress && pendingHref");
  });

  it("uses route loading boundaries instead of a duplicate full-screen pending surface", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).not.toContain("PendingNavigationSurface");
    expect(shell).not.toContain("pendingIsReader");
  });

  it("keeps recovery timeout as fallback rather than completion logic", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).toContain("isNavigationIntentComplete");
    expect(shell).toContain("navigationTiming.recoveryTimeoutMs");
  });

  it("leaves browser Back/Forward scroll restoration native", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).not.toContain('scrollRestoration = "manual"');
    expect(shell).not.toContain("yomirra:scroll:");
  });

  it("returns trigger focus when the command overlay closes without navigation", () => {
    const menu = read("src/components/app/command-menu.tsx");

    expect(menu).toContain("document.activeElement instanceof HTMLElement");
    expect(menu).toContain("trigger?.focus({ preventScroll: true })");
    expect(menu).toContain("restoreFocusOnCloseRef.current = false");
  });

  it("keeps catalog loading shells aligned with their final route geometry", () => {
    const sourceList = read("src/components/skeletons/source-list-skeleton.tsx");
    const sourceLoading = read("src/app/(web)/sources/[sourceId]/loading.tsx");
    const sourcePage = read("src/app/(web)/sources/[sourceId]/page.tsx");
    const searchPage = read("src/app/(web)/search/page.tsx");
    const libraryPage = read("src/app/(web)/library/page.tsx");
    const bookmarkPage = read("src/app/(web)/bookmark/page.tsx");

    expect(sourceList).toContain("grid-cols-1");
    expect(sourceList).toContain("md:grid-cols-2");
    expect(sourceList).toContain("xl:grid-cols-3");

    expect(sourceLoading).toContain("MangaGridSkeleton");
    expect(sourceLoading).not.toContain("SearchResultSkeleton");
    expect(sourcePage).toContain("MangaGridSkeleton");
    expect(sourcePage).not.toContain("SearchResultSkeleton");

    expect(searchPage).toContain("<PageHeader");
    expect(searchPage).toContain("hasMobileHeader");
    expect(libraryPage).toContain("<PageContainer hasMobileHeader>");
    expect(bookmarkPage).toContain("<BookmarkSkeleton />");
    expect(bookmarkPage).not.toContain("fallback={null}");
  });
});
