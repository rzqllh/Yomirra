import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("Home loading geometry contract", () => {
  it("keeps route and nested Suspense loading on the same Home geometry", () => {
    const routeLoading = read("src/app/(web)/loading.tsx");
    const page = read("src/app/(web)/page.tsx");

    expect(routeLoading).toContain("<SourceFeedSkeleton />");
    expect(page).toContain("fallback={<SourceFeedSkeleton />}");
  });

  it("matches final Home section order and includes recently updated geometry", () => {
    const skeleton = read("src/components/app/source-feed-skeleton.tsx");
    const hero = skeleton.indexOf('data-home-loading-section="hero"');
    const spotlight = skeleton.indexOf(
      'data-home-loading-section="spotlight-ranking"'
    );
    const continueReading = skeleton.indexOf(
      'data-home-loading-section="continue-reading"'
    );
    const recentlyUpdated = skeleton.indexOf(
      'data-home-loading-section="recently-updated"'
    );

    expect(hero).toBeGreaterThan(-1);
    expect(spotlight).toBeGreaterThan(hero);
    expect(continueReading).toBeGreaterThan(spotlight);
    expect(recentlyUpdated).toBeGreaterThan(continueReading);
  });

  it("renders the usable Hero instead of an artwork placeholder", () => {
    const skeleton = read("src/components/app/source-feed-skeleton.tsx");
    const hero = read("src/components/app/home-hero.tsx");

    expect(skeleton).toContain("<HomeHero candidates={[]} />");
    expect(hero).not.toContain("animate-pulse");
    expect(hero).toContain("Mau baca apa hari ini?");
  });
});
