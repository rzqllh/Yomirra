import { test, expect, type Page } from "./fixtures";
import Redis from "ioredis";
import { redisKeyNamespace } from "../src/server/lib/cache/redis-key-scope";
import { sourceRegistry } from "../src/shared/sources/source-registry";
import { sourceReadScope } from "../src/shared/sources/content-policy";

const source = {
  id: "mangadex",
  name: "MangaDex Fixture",
  language: "id",
  isEnabled: true,
  isInstalled: true,
  isDynamic: false,
  isNsfw: false,
  capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true },
};
const detailPath = `/sources/${source.id}`;
const mobileWidth = 767;
const desktopWidth = 768;

test.use({ reducedMotion: "reduce", serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true }, version: 0,
    }));
  });
  await page.route("**/api/sources/health", route => route.fulfill({ json: { data: {} } }));
  await page.route(
    url => [`/api/sources/${source.id}/latest`, `/api/sources/${source.id}/popular`].includes(url.pathname),
    route => route.fulfill({ json: { data: { mangas: [], hasNextPage: false } } }),
  );
});

async function openDetail(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const main = page.getByRole("main");
  await expect(main).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("splash-screen")).toHaveCount(0);
  return main;
}

async function expectHeading(page: Page, name: string) {
  const main = page.getByRole("main");
  await expect(main).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(main.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
}

async function desktopBackLink(page: Page) {
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb", exact: true });
  await expect(breadcrumb.getByRole("link", { name: "Sumber", exact: true }))
    .toHaveAttribute("href", "/sources");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Katalog sumber");
  const link = page.getByRole("main").getByRole("link", { name: "Kembali ke Sumber", exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/sources");
  return link;
}

test("direct source detail resolves the actual name and returns to its parent on mobile and desktop", async ({ page }) => {
  const previousPath = "/phase-one-source-history";
  await page.route(url => url.pathname === previousPath, route => route.fulfill({
    contentType: "text/html",
    body: "<!doctype html><title>Previous history entry</title>",
  }));
  await page.goto(previousPath);

  let releaseRegistry!: () => void;
  const pendingRegistry = new Promise<void>(resolve => { releaseRegistry = resolve; });
  let markRegistryRequested!: () => void;
  const registryRequested = new Promise<void>(resolve => { markRegistryRequested = resolve; });
  await page.route("**/api/sources", async route => {
    markRegistryRequested();
    await pendingRegistry;
    await route.fulfill({ json: { data: [source] } });
  });

  await page.setViewportSize({ width: mobileWidth, height: 720 });
  try {
    const main = await openDetail(page, detailPath);
    await registryRequested;
    await expectHeading(page, "Sumber");
    const mobileBack = main.getByRole("button", { name: "Kembali", exact: true });
    await expect(mobileBack).toBeVisible();
    releaseRegistry();
    await expect(main.getByText("Belum ada komik yang ditemukan.")).toBeVisible();
    await expectHeading(page, source.name);
    await mobileBack.press("Enter");
    await expect(page).toHaveURL(/\/sources$/);

    await page.setViewportSize({ width: desktopWidth, height: 720 });
    await openDetail(page, detailPath);
    await expectHeading(page, source.name);
    const back = await desktopBackLink(page);
    await expect(mobileBack).toBeHidden();
    await back.press("Enter");
    await expect(page).toHaveURL(/\/sources$/);
  } finally {
    releaseRegistry();
  }
});

test("Populer Katalog lengkap opens source detail and mobile back goes to Sumber", async ({ page, baseURL }) => {
  const redisUrl = process.env.REDIS_URL;
  test.skip(
    !(process.env.CI === "true" || process.env.E2E_ISOLATED_REDIS === "1") ||
      process.env.E2E_PRODUCTION_BUILD !== "1" || !baseURL ||
      !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname) ||
      !redisUrl || !["redis", "localhost", "127.0.0.1"].includes(new URL(redisUrl).hostname),
    "Requires the production build and disposable local Redis used for server-rendered fixtures",
  );

  const preferredLanguages = ["en", "id", "zz-XA"];
  const scope = sourceReadScope({ preferredLanguages, dataSaver: true });
  const key = `source:${source.id}:popular:content-v2:${scope}:1`;
  const redis = new Redis(redisUrl!, { keyPrefix: redisKeyNamespace, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  try {
    await redis.setex(key, 120, JSON.stringify({
      data: {
        mangas: [{ id: "phase-one-popular-work", title: "Komik Populer Fixture", coverUrl: "", isNsfw: false }],
        hasNextPage: false,
      },
      expiresAt: Date.now() + 120_000,
    }));
    await page.context().addCookies([
      { name: "yomirra-source-languages", value: preferredLanguages.join(","), url: baseURL! },
      { name: "yomirra-data-saver", value: "true", url: baseURL! },
      {
        name: "yomirra-disabled-sources",
        value: encodeURIComponent(JSON.stringify(sourceRegistry.filter(item => item.id !== source.id).map(item => item.id))),
        url: baseURL!,
      },
    ]);
    await page.route("**/api/sources", route => route.fulfill({ json: { data: [source] } }));
    await page.setViewportSize({ width: mobileWidth, height: 720 });
    await page.goto("/popular", { waitUntil: "domcontentloaded" });
    await expectHeading(page, "Populer");
    const filter = page.getByRole("group", { name: "Filter sumber komik" });
    await filter.getByRole("button", { name: "MangaDex (1)", exact: true }).click();
    const catalog = page.getByRole("link", { name: "Katalog lengkap", exact: true });
    await expect(catalog).toHaveAttribute("href", `${detailPath}?sort=popular`);
    await catalog.click();
    await expect(page).toHaveURL(/\/sources\/mangadex\?sort=popular$/);
    await expectHeading(page, source.name);
    await page.getByRole("main").getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(page).toHaveURL(/\/sources$/);
  } finally {
    try {
      await redis.del(key);
    } finally {
      await redis.quit();
    }
  }
});

for (const registry of ["unknown", "error"] as const) {
  test(`direct source detail keeps one heading and a parent link when the registry is ${registry}`, async ({ page }) => {
    await page.route("**/api/sources", route => registry === "error"
      ? route.fulfill({ status: 503, json: { error: { message: "Fixture registry unavailable" } } })
      : route.fulfill({ json: { data: [source] } }));
    await page.setViewportSize({ width: mobileWidth, height: 720 });
    const main = await openDetail(page, registry === "error" ? detailPath : "/sources/phase-one-unknown-source");
    if (registry === "error") {
      await expect(main.getByRole("alert")).toHaveText("Gagal memuat daftar sumber. Coba lagi nanti.");
    } else {
      await expect(main.getByText("Sumber tidak ditemukan.", { exact: true })).toBeVisible();
    }
    await expectHeading(page, "Sumber");
    await expect(main.getByRole("button", { name: "Kembali", exact: true })).toBeVisible();

    await page.setViewportSize({ width: desktopWidth, height: 720 });
    await expectHeading(page, "Sumber");
    await desktopBackLink(page);
  });
}
