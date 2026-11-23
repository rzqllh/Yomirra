import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const now = "2026-11-23T12:00:00.000Z";
    const libraryItems = {
      "saved-a": {
        id: "saved-a", schemaVersion: 2, sourceId: "mangadex", mangaId: "work-a",
        primarySourceId: "mangadex", primaryMangaId: "work-a",
        title: "Canonical Demo Work", addedAt: now, updatedAt: now, isBookmarked: true,
        coverUrl: "/cover-demo-a.png", isNsfw: false,
        linkedSources: [{ sourceId: "komiku", mangaId: "work-b", matchConfidence: "CONFIRMED", addedAt: 100 }],
      },
      "saved-b": {
        id: "saved-b", schemaVersion: 2, sourceId: "komiku", mangaId: "work-b",
        title: "Canonical Demo Work", addedAt: now, updatedAt: now,
        coverUrl: "/cover-demo-b.png", isBookmarked: true, isNsfw: false,
      },
      "saved-collision": {
        id: "saved-collision", sourceId: "mangadex", mangaId: "unrelated-work",
        title: "Canonical Demo Work", addedAt: now, updatedAt: now,
        isBookmarked: true, isNsfw: false,
      },
    };
    const historyItems = {
      "history-a": {
        sourceId: "mangadex", mangaId: "work-a", mangaTitle: "Canonical Demo Work",
        chapterId: "chapter-a", chapterTitle: "Chapter A", readAt: 100,
        savedTitleId: "saved-a",
        pageIndex: 2, totalPages: 10, isNsfw: false,
      },
      "history-b": {
        sourceId: "komiku", mangaId: "work-b", mangaTitle: "Canonical Demo Work",
        chapterId: "chapter-b", chapterTitle: "Chapter B", readAt: 200,
        savedTitleId: "saved-a",
        pageIndex: 5, totalPages: 12, isNsfw: false,
      },
    };
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0,
    }));
    localStorage.setItem("yomirra-source-preferences", JSON.stringify({
      state: { disabledSources: [], hiddenFromHomeSources: [] }, version: 2,
    }));
    localStorage.setItem("yomirra-library", JSON.stringify({
      state: { items: libraryItems }, version: 1,
    }));
    localStorage.setItem("yomirra-history", JSON.stringify({
      state: { items: historyItems, _hasHydrated: true }, version: 2,
    }));
    localStorage.setItem("yomirra-settings", JSON.stringify({
      state: { hideNsfw: true, perTitleSourcePreferences: { "saved-a": "mangadex" } },
      version: 4,
    }));
  });
});

test("verified Library works dedupe while unrelated same-title work remains separate", async ({ page }) => {
  await page.goto("/bookmark?tab=collection", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole("main")).toBeVisible();

  // The two CONFIRMED bindings share one card. Matching titles alone never merge.
  const catalogLinks = page.locator('a[href^="/catalog/saved/"]');
  await expect(catalogLinks).toHaveCount(2, { timeout: 15000 });

  await catalogLinks.first().click();
  await expect(page).toHaveURL(/\/catalog\/saved\/saved-a/);
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible();
  await expect(page.getByText("2 sumber tercatat")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut baca" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pilih sumber" })).toBeVisible();
});

test("History cover opens canonical detail but Lanjut honors preferred provider", async ({ page }) => {
  await page.goto("/bookmark", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole("main")).toBeVisible();

  // Both source sessions remain in the local store but appear as one card.
  await expect(page.getByText("1 bacaan aktif")).toBeVisible({ timeout: 15000 });
  const cover = page.getByRole("link", { name: "Buka katalog Canonical Demo Work" });
  await expect(cover).toBeVisible();
  await cover.click();
  await expect(page).toHaveURL(/\/catalog\/saved\//);
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible();

  await page.goto("/bookmark", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("1 bacaan aktif")).toBeVisible({ timeout: 15000 });
  const resume = page.getByRole("link", { name: "Lanjut baca Canonical Demo Work" });
  await expect(resume).toHaveAttribute("href", /\/manga\/mangadex\/work-a\/read\/chapter-a/);
});


test("Home dedupes confirmed reading sources and resumes explicit preferred provider", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15000 });
  const shelf = page.locator("#continue-reading-section");
  await expect(shelf).toBeVisible({ timeout: 15000 });
  await expect(shelf.getByRole("heading", { name: "Canonical Demo Work" })).toHaveCount(1);
  const catalog = shelf.getByRole("link", { name: "Buka katalog Canonical Demo Work" });
  await expect(catalog).toHaveAttribute("href", /\/catalog\/saved\/saved-a/);
  const resume = shelf.getByRole("link", { name: "Lanjut baca Canonical Demo Work" });
  await expect(resume).toHaveAttribute("href", /\/manga\/mangadex\/work-a\/read\/chapter-a/);
});
