import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import Redis from "ioredis";
import { test, expect, type Page } from "./fixtures";
import { redisKeyNamespace } from "../src/server/lib/cache/redis-key-scope";
import { sourceReadScope } from "../src/shared/sources/content-policy";
import { sourceRegistry } from "../src/shared/sources/source-registry";
import type { MangaItem } from "../src/shared/sources/source-types";
import type { MalPopularFeed } from "../src/shared/types/mal";

const sourceIds = ["shinigami", "komiku-ii"];
const works = [
  { slug: "ongoing", title: "Komik Fixture Sedang Terbit", status: "PUBLISHING", trackerId: "987654321001" },
  { slug: "unknown", title: "Komik Fixture Status Asing", status: "UNMAPPED_PUBLICATION", trackerId: "987654321002" },
];
const preferredLanguages = ["id", "en", "zz-XP"];
const disabledSources = sourceRegistry.filter(({ id }) => !sourceIds.includes(id)).map(({ id }) => id);
const landscape = { width: 667, height: 375 };
const desktop = { width: 1280, height: 800 };

function hasMalCredential() {
  if (process.env.MAL_CLIENT_ID !== undefined) return Boolean(process.env.MAL_CLIENT_ID.trim());
  // The Playwright worker does not load the dotenv files read by Next start.
  const envFiles = [".env.production.local", ".env.local", ".env.production", ".env"];
  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const value = parseEnv(readFileSync(file, "utf8")).MAL_CLIENT_ID;
    if (value !== undefined) return Boolean(value.trim());
  }
  return false;
}

function mangaId(sourceId: string, slug: string) {
  return `header-catalog-popular-${sourceId}-${slug}`;
}

async function expectNoHorizontalOverflow(page: Page) {
  const { width } = page.viewportSize()!;
  await expect.poll(() => page.evaluate(viewportWidth => {
    const root = document.documentElement;
    const main = document.querySelector("main")!;
    const panel = main.querySelector('[role="tabpanel"]:not([hidden])')!;
    return Math.max(
      root.scrollWidth - viewportWidth,
      root.scrollWidth - root.clientWidth,
      main.scrollWidth - main.clientWidth,
      panel.scrollWidth - panel.clientWidth,
    );
  }, width)).toBeLessThanOrEqual(0);
}

async function preparePopularPage(page: Page, origin: string, disabledSources: string[]) {
  await page.route(url => url.origin !== origin ||
    (url.pathname !== "/popular" && url.pathname !== "/api/site/config" &&
      (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc"))),
  route => route.abort());
  await page.addInitScript(({ disabledSources }) => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true }, version: 0,
    }));
    localStorage.setItem("yomirra-settings", JSON.stringify({
      state: { checkOnAppStart: false }, version: 4,
    }));
    localStorage.setItem("yomirra-source-preferences", JSON.stringify({
      state: { disabledSources }, version: 2,
    }));
  }, { disabledSources });
  await page.context().addCookies([
    { name: "yomirra-source-languages", value: preferredLanguages.join(","), url: origin },
    { name: "yomirra-data-saver", value: "true", url: origin },
    { name: "yomirra-disabled-sources", value: encodeURIComponent(JSON.stringify(disabledSources)), url: origin },
  ]);
}

async function openPopularPage(page: Page) {
  // The webServer liveness probe does not initialize the lazy Redis client.
  const readiness = await page.request.get("/api/health", { maxRedirects: 0 });
  await expect(readiness).toBeOK();
  expect((await readiness.json()).redis).toMatch(/^(ok|slow)$/);

  await page.setViewportSize(landscape);
  await page.goto("/popular", { waitUntil: "domcontentloaded" });
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Populer", level: 1, exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("splash-screen")).toHaveCount(0);
  return main;
}

test.use({ reducedMotion: "reduce", serviceWorkers: "block" });

test("Populer merges matched source cards and fits both tabs in landscape and desktop layouts", async ({ page, baseURL }) => {
  const redisUrl = process.env.REDIS_URL;
  test.skip(
    !(process.env.CI === "true" || process.env.E2E_ISOLATED_REDIS === "1") ||
      process.env.E2E_PRODUCTION_BUILD !== "1" || !baseURL ||
      !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname) ||
      !redisUrl || !["redis", "localhost", "127.0.0.1"].includes(new URL(redisUrl).hostname),
    "Requires a local production build with disposable Redis for the server-rendered source feeds",
  );
  // The initial MAL feed is server-rendered and checks credentials before reading its cache.
  test.skip(hasMalCredential(), "Requires the credential-free MyAnimeList fallback to avoid a live MAL request");

  const origin = new URL(baseURL!).origin;
  await preparePopularPage(page, origin, disabledSources);

  const scope = sourceReadScope({ preferredLanguages, dataSaver: true });
  const keyFor = (sourceId: string) => `source:${sourceId}:popular:content-v2:${scope}:1`;
  const redis = new Redis(redisUrl!, { keyPrefix: redisKeyNamespace, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  try {
    for (const sourceId of sourceIds) {
      const mangas: MangaItem[] = works.map(({ slug, title, status, trackerId }) => ({
        id: mangaId(sourceId, slug),
        title,
        status,
        coverUrl: "",
        format: "manga",
        contentRating: "safe",
        externalWorkIds: { anilist: trackerId },
      }));
      await redis.setex(keyFor(sourceId), 120, JSON.stringify({
        data: { mangas, hasNextPage: false },
        expiresAt: Date.now() + 120_000,
      }));
    }

    const main = await openPopularPage(page);
    const tabs = main.getByRole("tablist", { name: "Peringkat populer" });
    const localTab = tabs.getByRole("tab", { name: "Populer di Yomirra" });
    const malTab = tabs.getByRole("tab", { name: "Tren MyAnimeList" });
    const localPanel = main.getByRole("tabpanel", { name: "Populer di Yomirra" });
    const malPanel = main.getByRole("tabpanel", { name: "Tren MyAnimeList" });
    await expect(localTab).toHaveAttribute("aria-selected", "true");
    await expect(localPanel.getByRole("heading", { name: "Peringkat lintas sumber" })).toBeVisible();

    const cards = localPanel.getByRole("article");
    await expect(cards).toHaveCount(works.length);
    for (const { slug, title, status } of works) {
      const cardLink = page.getByRole("link", { name: `Lihat katalog ${title}`, exact: true });
      const card = cards.filter({ has: cardLink });
      await expect(card).toHaveCount(1);
      const link = card.getByRole("link", { name: `Lihat katalog ${title}`, exact: true });
      await expect(link).toHaveAttribute("href", /^\/catalog\/observed\?/);
      const href = new URL((await link.getAttribute("href"))!, origin);
      const refs: string[][] = JSON.parse(href.searchParams.get("refs")!);
      expect(refs.sort()).toEqual(sourceIds.map(sourceId => [sourceId, mangaId(sourceId, slug)]).sort());
      await expect(card).not.toContainText(new RegExp(status, "i"));
      if (slug === "ongoing") {
        await expect(card.getByText("Sedang terbit", { exact: true })).toBeVisible();
      } else {
        await expect(card.getByText(/^(Sedang terbit|Tamat|Hiatus|Dibatalkan|Tidak diketahui|Unknown)$/i)).toHaveCount(0);
      }
    }

    const desktopNav = page.getByRole("navigation", { name: "Navigasi desktop" });
    await expect(desktopNav).toBeHidden();
    for (const viewport of [landscape, desktop]) {
      if (viewport === desktop) {
        await page.setViewportSize(viewport);
        await expect(desktopNav).toBeVisible();
        const first = (await cards.nth(0).boundingBox())!;
        const second = (await cards.nth(1).boundingBox())!;
        expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
        expect(first.x + first.width).toBeLessThan(second.x);
      }
      await expectNoHorizontalOverflow(page);

      await malTab.click();
      await expect(malTab).toHaveAttribute("aria-selected", "true");
      await expect(localPanel).toBeHidden();
      await expect(malPanel.getByRole("heading", { name: "Tren MyAnimeList belum terhubung" })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await malPanel.getByRole("button", { name: "Jelajahi Populer di Yomirra" }).click();
      await expect(localTab).toHaveAttribute("aria-selected", "true");
      await expect(localTab).toBeFocused();
      await expect(cards).toHaveCount(works.length);
    }
  } finally {
    try {
      await redis.del(...sourceIds.map(keyFor));
    } finally {
      await redis.quit();
    }
  }
});

type ReadyMalFeed = Extract<MalPopularFeed, { status: "ready" }>;

const initialMalFeed: ReadyMalFeed = {
  status: "ready",
  safeOnly: true,
  rankingType: "bypopularity",
  fetchedAt: "2026-11-23T12:00:00Z",
  works: [{
    malId: 900001,
    title: "Komik Fixture Anggota MAL",
    coverUrl: "",
    rank: 1,
    members: 150,
    mediaType: "manga",
    nsfw: "white",
  }],
};
const favoriteMalFeed: ReadyMalFeed = {
  ...initialMalFeed,
  rankingType: "favorite",
  works: [{ ...initialMalFeed.works[0], malId: 900002, title: "Komik Fixture Favorit MAL" }],
};

// E2E_ISOLATED_MAL=1 attests that the Next process has external egress blocked.
// Port 3000 must be free so Playwright starts a fresh Next server inheriting the
// dummy credential and the same disposable Redis URL and namespace as this worker.
// Browser routing cannot protect Next's server-side fetch if the cache misses.
test("HC-17: the ready MAL tab fits its long sort label through loading, failure, and retry", async ({ page, baseURL }) => {
  const redisUrl = process.env.REDIS_URL;
  test.skip(
    process.env.E2E_ISOLATED_MAL !== "1" || process.env.E2E_ISOLATED_REDIS !== "1" ||
      process.env.E2E_PRODUCTION_BUILD !== "1" || process.env.MAL_CLIENT_ID !== "e2e-local-mal-fixture" ||
      !baseURL || !["http://localhost:3000", "http://127.0.0.1:3000"].includes(new URL(baseURL).origin) ||
      !redisUrl || !["localhost", "127.0.0.1"].includes(new URL(redisUrl).hostname),
    "Requires E2E_ISOLATED_MAL=1, E2E_ISOLATED_REDIS=1, E2E_PRODUCTION_BUILD=1 and the dummy MAL credential on an egress-blocked local Next server with disposable loopback Redis",
  );

  const origin = new URL(baseURL!).origin;
  await preparePopularPage(page, origin, sourceRegistry.map(({ id }) => id));
  const releaseFailure = Promise.withResolvers<void>();
  let favoriteRequests = 0;
  await page.route(url => url.origin === origin &&
    url.pathname === "/api/metadata/mal/popular" && url.searchParams.get("type") === "favorite", async route => {
    favoriteRequests += 1;
    if (favoriteRequests === 1) {
      await releaseFailure.promise;
      await route.fulfill({ status: 503 });
    } else {
      await route.fulfill({ json: { data: favoriteMalFeed } });
    }
  });

  const key = "metadata:mal:ranking:v2:bypopularity:safe";
  const redis = new Redis(redisUrl!, { keyPrefix: redisKeyNamespace, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const value = JSON.stringify({ data: initialMalFeed, expiresAt: Date.now() + 120_000 });
  let seeded = false;
  try {
    seeded = await redis.set(key, value, "EX", 120, "NX") === "OK";
    expect(seeded, "The disposable Redis instance must have an empty MAL cache key").toBe(true);

    const main = await openPopularPage(page);
    await main.getByRole("tab", { name: "Tren MyAnimeList", exact: true }).click();
    const panel = main.getByRole("tabpanel", { name: "Tren MyAnimeList" });
    await expect(panel.getByRole("heading", { name: "Peringkat Global MyAnimeList" })).toBeVisible();
    const initialTitle = panel.getByRole("heading", { name: initialMalFeed.works[0].title, exact: true });
    await expect(initialTitle).toBeVisible();
    const sort = panel.getByRole("button", { name: "Urutkan hasil MAL: Anggota terbanyak", exact: true });
    await sort.click();
    await page.getByRole("menuitemradio", { name: "Paling Difavoritkan", exact: true }).click();

    const favoriteSort = panel.getByRole("button", { name: "Urutkan hasil MAL: Paling Difavoritkan", exact: true });
    const label = favoriteSort.getByText("Paling Difavoritkan", { exact: true });
    const loading = panel.getByRole("status").filter({ hasText: "Memperbarui…" });
    const failure = panel.getByRole("status").filter({ hasText: "Peringkat untuk pilihan ini gagal dimuat." });
    const favoriteTitle = panel.getByRole("heading", { name: favoriteMalFeed.works[0].title, exact: true });
    const expectLayoutAtBothSizes = async () => {
      for (const viewport of [landscape, desktop]) {
        await page.setViewportSize(viewport);
        await expect(label).toBeVisible();
        await expect.poll(() => label.evaluate(element => element.scrollWidth - element.clientWidth))
          .toBeLessThanOrEqual(0);
        await expectNoHorizontalOverflow(page);
      }
    };

    await expect(loading).toBeVisible();
    await expect(initialTitle).toBeHidden();
    await expectLayoutAtBothSizes();
    releaseFailure.resolve();

    await expect(failure).toBeVisible();
    await expect(loading).toBeHidden();
    await expect(initialTitle).toBeHidden();
    await expectLayoutAtBothSizes();

    await panel.getByRole("button", { name: "Coba lagi", exact: true }).click();
    await expect(favoriteTitle).toBeVisible();
    await expect(failure).toBeHidden();
    await expectLayoutAtBothSizes();
    expect(favoriteRequests).toBe(2);
  } finally {
    releaseFailure.resolve();
    try {
      if (seeded) {
        await redis.eval(
          "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end",
          1, key, value,
        );
      }
    } finally {
      await redis.quit();
    }
  }
});
