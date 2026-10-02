import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("component continuity contracts", () => {
  it("keeps tab and view-mode layout indicators instance-scoped", () => {
    const tabs = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/ui/tabs.tsx"),
      "utf-8"
    );
    const viewMode = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/manga/view-mode-toggle.tsx"),
      "utf-8"
    );

    expect(tabs).toContain("tab-indicator-${context.indicatorId");
    expect(tabs).not.toContain('layoutId="tab-indicator"');
    expect(viewMode).toContain("viewmode-pill-${indicatorId}");
    expect(viewMode).not.toContain('layoutId="viewmode-pill"');
  });

  it("does not tie library scroll reset to listing view mode", () => {
    const catalogHook = fs.readFileSync(
      path.resolve(process.cwd(), "src/shared/hooks/use-library-catalog.ts"),
      "utf-8"
    );

    expect(catalogHook).toMatch(
      /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\);\s*\}, \[page\]\);/
    );
    expect(catalogHook).not.toMatch(
      /window\.scrollTo[\s\S]{0,160}\[page,\s*listingViewMode\]/
    );
  });

  it("keeps shared transitions limited to card, cover, and title identity", () => {
    const identity = fs.readFileSync(
      path.resolve(process.cwd(), "src/shared/lib/motion/transition-identity.ts"),
      "utf-8"
    );

    expect(identity).toContain("card:");
    expect(identity).toContain("cover:");
    expect(identity).toContain("title:");
    expect(identity).not.toContain("metadata");
    expect(identity).not.toContain("badge");
  });
});
