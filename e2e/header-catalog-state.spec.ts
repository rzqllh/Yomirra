import { test, expect, type Page } from "./fixtures";

const savedTitleId = "phase-one-saved";
const mangaId = "phase-one-work";
const title = "Komik Fixture Fase Satu";
const chapterPath = `/api/sources/mangadex/manga/${mangaId}/chapters`;

test.use({ reducedMotion: "reduce", serviceWorkers: "block" });

async function openRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0);
}

async function seedLibrary(page: Page) {
  await page.addInitScript(({ savedTitleId, mangaId, title }) => {
    const timestamp = "2026-11-23T12:00:00.000Z";
    localStorage.setItem("yomirra-library", JSON.stringify({
      version: 1,
      state: {
        items: {
          [savedTitleId]: {
            id: savedTitleId,
            schemaVersion: 2,
            sourceId: "mangadex",
            mangaId,
            primarySourceId: "mangadex",
            primaryMangaId: mangaId,
            title,
            coverUrl: "/fixture-cover.png",
            isBookmarked: true,
            isNsfw: false,
            status: "ONGOING",
            releaseDay: -2,
            addedAt: timestamp,
            updatedAt: timestamp,
          },
        },
      },
    }));
  }, { savedTitleId, mangaId, title });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true }, version: 0,
    }));
    localStorage.setItem("yomirra-settings", JSON.stringify({
      state: { checkOnAppStart: false, hideNsfw: false }, version: 4,
    }));
  });
});

test("empty Updates offers one keyboard-operable refresh and a catalog link", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openRoute(page, "/updates");

  const main = page.getByRole("main");
  const empty = main.getByRole("heading", { name: "Belum ada jadwal untuk ditampilkan" });
  const refresh = main.getByRole("button", { name: "Perbarui", exact: true });
  await expect(empty).toBeVisible();
  await expect(refresh).toHaveCount(1);
  await refresh.focus();
  await expect(refresh).toBeFocused();
  await refresh.press("Enter");
  await expect(refresh).toBeEnabled();
  await expect(empty).toBeVisible();
  await expect(main.getByRole("link", { name: "Jelajahi komik" })).toHaveAttribute("href", "/library");
});

test("Updates disables desktop refresh during a keyboard-triggered scan and recovers offline", async ({ page, context }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await seedLibrary(page);

  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
  const chaptersUrl = (url: URL) => url.pathname === chapterPath;
  let chapterRequests = 0;
  page.on("request", request => {
    if (chaptersUrl(new URL(request.url()))) chapterRequests += 1;
  });
  await page.route(chaptersUrl, async route => {
    await responseGate;
    await route.fulfill({
      headers: { "cache-control": "no-store" },
      json: { data: [{ id: "fixture-chapter", mangaId, title: "Chapter 1", number: 1, isLocked: false }] },
    });
  });

  try {
    await openRoute(page, "/updates");
    const main = page.getByRole("main");
    const lane = main.locator("[data-container-variant]");
    const refresh = lane.getByRole("button", { name: "Perbarui", exact: true });
    await expect(main.getByRole("button", { name: "Perbarui", exact: true })).toHaveCount(1);
    await lane.getByRole("button", { name: /^Semua\b/ }).click();
    await expect(refresh).toBeVisible();
    await refresh.focus();
    await expect(refresh).toBeFocused();
    expect(chapterRequests).toBe(0);

    const request = page.waitForRequest(request => chaptersUrl(new URL(request.url())));
    await refresh.press("Enter");
    await request;
    await expect(lane.getByRole("button", { name: "Memperbarui…", exact: true })).toBeDisabled();
    releaseResponse();
    await expect(refresh).toBeEnabled();
    await expect(lane.getByRole("link", { name: /mulai baca Komik Fixture Fase Satu/i }))
      .toHaveAttribute("href", /\/read\/fixture-chapter(?:\?|$)/);
    expect(chapterRequests).toBe(1);
    const scanError = lane.getByText("1 komik gagal dimuat", { exact: true });
    await expect(scanError).toHaveCount(0);

    await page.unroute(chaptersUrl);
    await context.setOffline(true);
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    const offlineFailure = page.waitForEvent("requestfailed", request => chaptersUrl(new URL(request.url())));
    await refresh.press("Enter");
    await offlineFailure;
    await expect(scanError).toBeVisible();
    await expect(refresh).toBeEnabled();
    expect(chapterRequests).toBe(2);
  } finally {
    releaseResponse();
    await context.setOffline(false);
  }
});

for (const { id, heading } of [
  { id: savedTitleId, heading: title },
  { id: "phase-one-unknown", heading: "Katalog tidak tersedia" },
]) {
  test(`saved detail ${id} has one main and H1 and returns to Library`, async ({ page }) => {
    await seedLibrary(page);
    await page.setViewportSize({ width: 767, height: 640 });
    await openRoute(page, `/catalog/saved/${id}`);

    const main = page.getByRole("main");
    const back = main.getByRole("link", { name: "Kembali ke Library", exact: true });
    for (const width of [767, 768]) {
      await page.setViewportSize({ width, height: 640 });
      await expect(main).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(main.getByRole("heading", { name: heading, level: 1, exact: true })).toBeVisible();
      await expect(back).toHaveAttribute("href", "/bookmark");
    }

    await back.press("Enter");
    await expect(page).toHaveURL(/\/bookmark(?:\?|$)/);
    await expect(main.getByRole("heading", { name: "Library", level: 1, exact: true })).toBeVisible();
  });
}

test.describe("saved detail before hydration", () => {
  test.use({ javaScriptEnabled: false });

  test("renders one main, a loading heading, and status in the server markup", async ({ page }) => {
    await page.goto(`/catalog/saved/${savedTitleId}`);

    // The boot overlay makes the shell inert until hydration completes.
    const main = page.getByRole("main", { includeHidden: true });
    await expect(main).toHaveCount(1);
    await expect(main.getByRole("heading", { level: 1, includeHidden: true })).toHaveCount(1);
    await expect(main.getByRole("heading", { level: 1, includeHidden: true })).toHaveText("Detail katalog");
    await expect(main.getByRole("status", { includeHidden: true }).filter({ hasText: "Memuat katalog…" }))
      .toHaveCount(1);
  });
});
