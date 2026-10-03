import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("shared reader geometry contracts", () => {
  it("uses PageContainer for source catalog and its loading state", () => {
    const page = read("src/app/(web)/sources/[sourceId]/page.tsx");
    const loading = read("src/app/(web)/sources/[sourceId]/loading.tsx");
    expect(page).toContain("<PageContainer hasMobileHeader>");
    expect(loading).toContain("<PageContainer hasMobileHeader>");
    expect(page).not.toContain("pt-[calc(var(--mobile-header-height");
  });

  it("keeps schedule loading on the shared bottom-safe reservation", () => {
    const loading = read("src/app/(web)/updates/loading.tsx");
    expect(loading).toContain("<PageContainer hasMobileHeader>");
    expect(loading).not.toContain("bottom-nav-height");
  });

  it("gives featured leaderboard rank independent row and cover geometry", () => {
    const row = read("src/components/manga/card/leaderboard-row.tsx");
    expect(row).toContain('min-h-[76px] py-1.5');
    expect(row).toContain('h-[64px] w-12');
    expect(row).toContain("Chapter belum tersedia");
    expect(row).not.toContain('"-.-"');
  });
});
