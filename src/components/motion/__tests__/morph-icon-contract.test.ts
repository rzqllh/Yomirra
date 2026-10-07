import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { morphIconPairs } from "@/shared/lib/motion/morph-icons";

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

describe("MorphIcon package boundary", () => {
  it("defines only the approved first morph pairs", () => {
    expect(Object.keys(morphIconPairs)).toEqual([
      "bookmark",
      "viewMode",
      "disclosure",
      "playback",
    ]);

    for (const pair of Object.values(morphIconPairs)) {
      expect(pair.off.length).toBeGreaterThan(4);
      expect(pair.on.length).toBeGreaterThan(4);
    }
  });

  it("honors user reduced-motion preference at the package boundary", () => {
    const wrapper = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/motion/morph-icon.tsx"),
      "utf-8"
    );

    expect(wrapper).toContain('from "morphicons/react"');
    expect(wrapper).toContain('reducedMotion="user"');
  });

  it("keeps direct morphicons imports out of feature components", () => {
    const srcRoot = path.resolve(process.cwd(), "src");
    const wrapperPath = path.resolve(
      process.cwd(),
      "src/components/motion/morph-icon.tsx"
    );

    const offenders = collectSourceFiles(srcRoot)
      .filter((file) => file !== wrapperPath)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .filter((file) =>
        fs.readFileSync(file, "utf-8").includes('from "morphicons')
      );

    expect(offenders).toEqual([]);
  });

  it("adopts MorphIcon through the package boundary for approved feature state", () => {
    const mangaDetailView = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/komik/manga-detail-view.tsx"),
      "utf-8"
    );

    expect(mangaDetailView).toContain(
      'from "@/components/motion/morph-icon"'
    );
    expect(mangaDetailView).toContain("morphIconPairs.disclosure");
  });
});
