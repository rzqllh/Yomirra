import { test, expect } from "./fixtures";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/sources/nsfw-ids", (route) => route.fulfill({ json: { data: [] } }));
  await page.addInitScript(() => {
    if (sessionStorage.getItem("canonical-library-fixture")) return;
    sessionStorage.setItem("canonical-library-fixture", "seeded");
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
      "mangadex::unrelated-work": {
        id: "mangadex::unrelated-work", sourceId: "mangadex", mangaId: "unrelated-work",
        title: "Canonical Demo Work", addedAt: now, updatedAt: now,
        isBookmarked: true, isNsfw: false,
        linkedSources: [{ sourceId: "shinigami", mangaId: "legacy-work", matchConfidence: "CONFIRMED", addedAt: 100 }],
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
      state: { hideNsfw: true, checkOnAppStart: false, perTitleSourcePreferences: { "saved-a": "mangadex" } },
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

  await page.locator('a[href="/catalog/saved/saved-a"]').click();
  await expect(page).toHaveURL(/\/catalog\/saved\/saved-a/, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sumber bacaan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lanjut baca" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pilih sumber" })).toBeVisible();
});

test("encoded Library links open the saved detail for current and previously linked IDs", async ({ page }) => {
  const currentHref = "/catalog/saved/mangadex%3A%3Aunrelated-work";
  await page.goto("/bookmark?tab=collection", { waitUntil: "domcontentloaded" });
  await page.locator(`a[href="${currentHref}"]`).click({ timeout: 15000 });
  await expect(page).toHaveURL(currentHref, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL("/bookmark?tab=collection");

  await page.goto("/catalog/saved/shinigami%3A%3Alegacy-work", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Pilih sumber" }).click();
  await expect(page.locator('a[href^="/manga/mangadex/unrelated-work?"]')).toHaveText("Buka");
});

test("a saved title survives an inactive source and remembers an explicitly added alternative", async ({ page }) => {
  const savedId = "komiku::retired-work";
  const title = "Komik Uji Pemulihan Sumber";
  await page.addInitScript(({ savedId, title }) => {
    if (!sessionStorage.getItem("seed-source-recovery")) return;
    sessionStorage.removeItem("seed-source-recovery");
    const timestamp = "2026-11-23T12:00:00.000Z";
    localStorage.setItem("yomirra-library", JSON.stringify({
      state: { items: { [savedId]: {
        id: savedId, schemaVersion: 2, sourceId: "komiku", mangaId: "retired-work",
        primarySourceId: "komiku", primaryMangaId: "retired-work", title,
        isBookmarked: true, isNsfw: false, addedAt: timestamp, updatedAt: timestamp,
      } } }, version: 1,
    }));
    localStorage.setItem("yomirra-source-preferences", JSON.stringify({
      state: { disabledSources: ["komiku"], hiddenFromHomeSources: [] }, version: 2,
    }));
    const settings = JSON.parse(localStorage.getItem("yomirra-settings")!);
    settings.state.perTitleSourcePreferences[savedId] = "komiku";
    localStorage.setItem("yomirra-settings", JSON.stringify(settings));
  }, { savedId, title });
  await page.route("**/api/sources/*/search?**", (route) => {
    const url = new URL(route.request().url());
    const results = url.pathname.endsWith("/mangadex/search") && url.searchParams.get("q") === title
      ? [{ id: "recovered-work", title, format: "MANGA", isNsfw: false, contentRating: "safe" }]
      : [];
    return route.fulfill({ json: { data: { results, hasNextPage: false } } });
  });

  await page.goto("/bookmark?tab=collection", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15000 });
  await page.evaluate(() => sessionStorage.setItem("seed-source-recovery", "yes"));
  await page.reload({ waitUntil: "domcontentloaded" });

  const savedLink = page.getByRole("link", { name: `Lihat katalog ${title}` });
  await expect(savedLink).toBeVisible({ timeout: 15000 });
  await expect(savedLink.getByText("Sumber belum tersedia", { exact: true })).toBeVisible();
  await expect(savedLink.getByText("Sumber Nonaktif", { exact: true })).toHaveCount(0);
  await savedLink.click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pilih sumber", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Cari alternatif", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cari sumber alternatif" });
  await dialog.getByRole("option", { name: new RegExp(title) }).click();
  await dialog.getByRole("button", { name: "Tambahkan sumber ini" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(`/catalog/saved/${encodeURIComponent(savedId)}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.getByText("Sumber utama: Komiku", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="/manga/mangadex/recovered-work?"]')).toHaveText("Buka");
  await expect(page.getByRole("button", { name: "Cari alternatif", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL("/bookmark?tab=collection");
  await expect(savedLink).toHaveCount(1);
  await expect(savedLink.getByText("Sumber belum tersedia", { exact: true })).toHaveCount(0);
});

test("History cover opens canonical detail but Lanjut honors preferred provider", async ({ page }) => {
  await page.goto("/bookmark", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole("main")).toBeVisible();

  // Both source sessions remain in the local store but appear as one card.
  await expect(page.getByText("1 bacaan aktif")).toBeVisible({ timeout: 15000 });
  const cover = page.getByRole("link", { name: "Buka katalog Canonical Demo Work" });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("href", /\/catalog\/saved\/saved-a$/);
  await cover.click();
  await expect(page).toHaveURL(/\/catalog\/saved\/saved-a/);
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
  await catalog.click();
  await expect(page.getByRole("heading", { name: "Canonical Demo Work" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(catalog).toBeVisible();
});
