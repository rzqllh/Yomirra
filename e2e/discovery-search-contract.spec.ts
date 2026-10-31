import { test, expect, type Page } from "@playwright/test";

// Fixture-backed route tests verify UI contracts, not live provider availability.
async function prepareDiscovery(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0 }));
    localStorage.setItem("yomirra-search-filters", JSON.stringify({ state: { selectedSources: ["komiku"], hasCustomizedSources: true, genres: [], formats: [], status: "", sort: "popular" }, version: 2 }));
  });
  const sources = ["komiku", "mangadex"].map((id) => ({
    id, name: id === "komiku" ? "Source A" : "Source B", isEnabled: true, isInstalled: true, isNsfw: false, isDynamic: false, status: "online",
    capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: true },
  }));
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let data: unknown;
    if (url.pathname === "/api/sources") data = sources;
    else if (url.pathname.endsWith("/filters")) data = { genres: [{ id: "action", name: "Action" }], formats: [{ id: "manga", name: "Manga" }], statuses: [{ id: "ongoing", name: "Berjalan" }], sorts: url.pathname.includes("/mangadex/")
      ? [{ id: "followedCount", name: "Populer" }, { id: "latestUploadedChapter", name: "Terbaru" }, { id: "createdAt", name: "Terbaru Ditambahkan" }]
      : [{ id: "popular", name: "Populer" }, { id: "latest", name: "Terbaru" }] };
    else if (url.pathname === "/api/sources/search") {
      const id = url.searchParams.get("sources") ?? "";
      data = { resultsBySource: { [id]: url.searchParams.get("q") === "failure"
        ? { results: [], error: "Provider tidak dapat dijangkau" }
        : { results: [{ id: "result", title: `Quick ${id}`, coverUrl: "", contentRating: "safe" }] } } };
    } else if (/\/api\/sources\/[^/]+\/(popular|latest|search)$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3];
      data = { mangas: [{ id: "work", title: `Catalog ${id}`, coverUrl: "", contentRating: "safe" }], hasNextPage: false };
    } else if (url.pathname === "/api/search/intelligence") data = { semanticAvailable: false, scores: {}, catalogMatches: [] };
    else if (url.pathname === "/api/sources/nsfw-ids") data = [];
    else if (url.pathname === "/api/sources/health") data = {};
    else return route.continue();
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data }) });
  });
}

async function openCatalog(page: Page, extra = "") {
  await page.goto(`/library?source=komiku${extra}`);
  await expect(page.getByText("Catalog komiku", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => prepareDiscovery(page));

test("Quick Search follows Jelajah after source switch and client navigation; Cari stays independent", async ({ page }) => {
  test.setTimeout(120_000);
  await openCatalog(page, "&page=3");
  await page.getByRole("button", { name: "Sumber Jelajah: Source A", exact: true }).click();
  await page.getByRole("menuitem", { name: "Source B", exact: true }).click();
  await expect(page).toHaveURL(/source=mangadex/);
  await expect(page.getByText("Catalog mangadex", { exact: true }).first()).toBeVisible();
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await page.goBack();
  await expect(page).toHaveURL(/source=komiku&page=3/);
  await expect(page.getByText("Catalog komiku", { exact: true }).first()).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/source=mangadex/);
  await expect(page.getByText("Catalog mangadex", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Cari", exact: true }).click();
  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByRole("button", { name: "Source A", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Source B", exact: true })).toHaveAttribute("aria-pressed", "false");
  const trigger = page.getByPlaceholder("Cari judul, kreator, atau #tag…");
  await trigger.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Quick Search", exact: true });
  await expect(dialog).toBeVisible();
  await page.getByRole("combobox", { name: "Quick Search di sumber Jelajah" }).fill("work");
  await expect(dialog.getByText("Quick mangadex", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Quick komiku", { exact: true })).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(dialog.locator('[cmdk-item][aria-selected="true"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Source A", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("provider failure stays distinct from empty results in Quick Search", async ({ page }) => {
  await openCatalog(page);
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Quick Search di sumber Jelajah" }).fill("failure");
  const dialog = page.getByRole("dialog", { name: "Quick Search", exact: true });
  await expect(dialog.getByText("Provider tidak dapat dijangkau", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Tidak ada hasil di sumber Jelajah ini.", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Buka Cari", { exact: true })).toBeVisible();
});

test("native provider sorts settle without a render loop and reach the request", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/library?source=mangadex&sort=latest&page=3");
  await expect(page.getByText("Catalog mangadex", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("page")).toBe("3");
  await page.getByRole("button", { name: "Urutkan Jelajah: Terbaru", exact: true }).click();
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/api/sources/mangadex/search" && new URL(req.url()).searchParams.get("sort") === "createdAt");
  await page.getByRole("menuitem", { name: "Terbaru Ditambahkan", exact: true }).click();
  await request;
  await expect(page).toHaveURL(/sort=createdAt/);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await expect(page.getByRole("button", { name: "Urutkan Jelajah: Terbaru Ditambahkan", exact: true })).toBeVisible();
  await expect(page.getByText("Catalog mangadex", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yomirra mengalami kendala", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1366, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`actual routes keep filters and centered Quick Search inside ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await openCatalog(page);
    const desktop = viewport.width >= 1024;
    if (desktop) {
      await expect(page.getByRole("region", { name: "Filter Jelajah", exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: /^Filter\s*(\(.*\))?$/ }).click();
      await expect(page.getByRole("region", { name: "Filter Jelajah", exact: true })).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      await page.getByRole("button", { name: /^Filter\s*(\(.*\))?$/ }).click();
      await expect(page.getByRole("dialog", { name: "Filter Jelajah", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Batal", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Quick Search", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Quick Search di sumber Jelajah" })).toBeFocused();
    await expect.poll(async () => {
      const rect = await dialog.boundingBox();
      return rect ? Math.abs(rect.x + rect.width / 2 - viewport.width / 2) : Infinity;
    }).toBeLessThan(2);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
    await dialog.getByRole("combobox", { name: "Quick Search di sumber Jelajah" }).press("Escape");
    await expect(dialog).toHaveCount(0);
    for (const path of ["/search", "/bookmark", "/settings"]) {
      // Isolate layout probes from document teardown/HMR. Client navigation and
      // Back/Forward are exercised by the first contract above.
      const routePage = await page.context().newPage();
      try {
        const hydrationErrors: string[] = [];
        routePage.on("pageerror", (error) => {
          if (/hydration|server rendered html/i.test(error.message)) hydrationErrors.push(error.message);
        });
        await prepareDiscovery(routePage);
        await routePage.setViewportSize(viewport);
        await routePage.goto(path, { waitUntil: "domcontentloaded" });
        if (path === "/search") await expect(routePage.getByRole("button", { name: "Source A", exact: true })).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
        else if (path === "/bookmark") await expect(routePage.getByRole("button", { name: "Sedang Dibaca", exact: true })).toBeVisible({ timeout: 15_000 });
        else await expect(routePage.locator('[data-hydrated="true"]')).toBeVisible({ timeout: 15_000 });
        await expect(routePage).toHaveURL(new RegExp(`${path}$`));
        await expect.poll(() => routePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        if (path === "/search") expect(hydrationErrors).toEqual([]);
      } finally {
        await routePage.close();
      }
    }
  });
}
