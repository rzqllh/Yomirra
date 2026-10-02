import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("accessibility motion contracts", () => {
  it("keeps a global reduced-motion safety net for CSS and view transitions", () => {
    const css = read("src/app/(web)/globals.css");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: 0.01ms !important");
    expect(css).toContain("::view-transition-old(*)");
    expect(css).toContain("animation-duration: 0s !important");
  });

  it("keeps high-motion navigation and card surfaces reduced-motion aware", () => {
    const pageTransition = read("src/components/motion/page-transition.tsx");
    const mangaCard = read("src/components/manga/card/manga-card.tsx");
    const onboarding = read("src/components/app/onboarding-overlay.tsx");

    expect(pageTransition).toContain("useReducedMotion");
    expect(pageTransition).toContain("reducedMotion ? { duration: 0 }");
    expect(mangaCard).toContain("useReducedMotion");
    expect(mangaCard).toContain("whileHover={reducedMotion ? undefined");
    expect(onboarding).toContain("useReducedMotion");
    expect(onboarding).toContain('role="dialog"');
    expect(onboarding).toContain('aria-modal="true"');
    expect(onboarding).toContain("reducedMotion ? { duration: 0 }");
  });

  it("keeps shared overlay and reader-error controls at the 44px touch target baseline", () => {
    const dialog = read("src/components/ui/dialog.tsx");
    const sheet = read("src/components/ui/sheet.tsx");
    const filterDrawer = read("src/components/ui/filter-drawer-shell.tsx");
    const readerError = read("src/components/reader/page-image-error.tsx");
    const onboarding = read("src/components/app/onboarding-overlay.tsx");

    expect(dialog).toContain("size-11");
    expect(sheet).toContain("size-11");
    expect(filterDrawer).toContain("min-h-11");
    expect(readerError).toContain("size-11");
    expect(onboarding).toContain("size-11");
    expect(onboarding).toContain("min-h-11");
  });

  it("keeps critical error surfaces free from continuous decorative animation", () => {
    const errorState = read("src/components/states/error-state.tsx");
    const readerError = read("src/components/reader/page-image-error.tsx");

    expect(errorState).not.toMatch(/animate-(spin|pulse|bounce|ping)/);
    expect(readerError).not.toMatch(/animate-(spin|pulse|bounce|ping)/);
  });
});
