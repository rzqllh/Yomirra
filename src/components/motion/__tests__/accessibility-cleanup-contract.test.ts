import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");
}

describe("accessibility cleanup contracts", () => {
  it("keeps a global reduced-motion safety net for CSS and view transitions", () => {
    const css = read("src/app/(web)/globals.css");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: 0.01ms !important");
    expect(css).toContain("::view-transition-old(*)");
    expect(css).toContain("animation-duration: 0s !important");
  });

  it("keeps reader panel motion reduced and exposes modal semantics", () => {
    const source = read("src/components/reader/reader-panel-shell.tsx");

    expect(source).toContain("useReducedMotion");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("reducedMotion ? { duration: 0 }");
  });

  it("keeps onboarding modal semantics and reduced-motion behavior explicit", () => {
    const onboarding = read("src/components/app/onboarding-overlay.tsx");
    const pageTransition = read("src/components/motion/page-transition.tsx");
    const mangaCard = read("src/components/manga/card/manga-card.tsx");

    expect(onboarding).toContain("useReducedMotion");
    expect(onboarding).toContain('role="dialog"');
    expect(onboarding).toContain('aria-modal="true"');
    expect(onboarding).toContain("reducedMotion ? { duration: 0 }");
    expect(pageTransition).toContain("useReducedMotion");
    expect(pageTransition).toContain("reducedMotion ? { duration: 0 }");
    expect(mangaCard).toContain("useReducedMotion");
    expect(mangaCard).toContain("whileHover={reducedMotion ? undefined");
  });

  it("keeps critical close, reset, chapter, onboarding, and reader-error controls at least 44px", () => {
    const dialog = read("src/components/ui/dialog.tsx");
    const sheet = read("src/components/ui/sheet.tsx");
    const filterDrawer = read("src/components/ui/filter-drawer-shell.tsx");
    const chapterDrawer = read("src/components/reader/reader-chapter-drawer.tsx");
    const readerError = read("src/components/reader/page-image-error.tsx");
    const onboarding = read("src/components/app/onboarding-overlay.tsx");

    expect(dialog).toContain("size-11");
    expect(sheet).toContain("size-11");
    expect(filterDrawer).toContain("min-h-11 px-3");
    expect(chapterDrawer).toContain("min-h-11 rounded-xl");
    expect(readerError).toContain("size-11");
    expect(onboarding).toContain("size-11");
    expect(onboarding).toContain("min-h-11");
  });

  it("keeps critical error-state surfaces free of continuous decorative animation", () => {
    const errorState = read("src/components/states/error-state.tsx");
    const readerError = read("src/components/reader/page-image-error.tsx");

    expect(errorState).not.toMatch(/animate-(spin|pulse|bounce|ping)/);
    expect(readerError).not.toMatch(/animate-(spin|pulse|bounce|ping)/);
    expect(errorState).not.toContain("repeat: Infinity");
    expect(readerError).not.toContain("repeat: Infinity");
  });
});
