import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");
}

describe("accessibility cleanup contracts", () => {
  it("keeps reader panel motion reduced and exposes modal semantics", () => {
    const source = read("src/components/reader/reader-panel-shell.tsx");

    expect(source).toContain("useReducedMotion");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("reducedMotion ? { duration: 0 }");
  });

  it("keeps critical close, reset, and chapter controls at least 44px", () => {
    const dialog = read("src/components/ui/dialog.tsx");
    const filterDrawer = read("src/components/ui/filter-drawer-shell.tsx");
    const chapterDrawer = read("src/components/reader/reader-chapter-drawer.tsx");

    expect(dialog).toContain("size-11");
    expect(filterDrawer).toContain("min-h-11 px-3");
    expect(chapterDrawer).toContain("min-h-11 rounded-xl");
  });

  it("keeps critical error-state surfaces free of continuous decorative animation", () => {
    const errorState = read("src/components/states/error-state.tsx");

    expect(errorState).not.toContain("animate-spin");
    expect(errorState).not.toContain("animate-pulse");
    expect(errorState).not.toContain("repeat: Infinity");
  });
});
