import Redis from "ioredis";
import { test, expect } from "./fixtures";
import { redisKeyNamespace } from "../src/server/lib/cache/redis-key-scope";
import { sourceReadScope } from "../src/shared/sources/content-policy";
import { sourceRegistry } from "../src/shared/sources/source-registry";

test.use({ serviceWorkers: "block", reducedMotion: "reduce" });

test("catalog and saved title navigation restore their original entries", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const redisUrl = process.env.REDIS_URL;
  test.skip(
    !(process.env.CI === "true" || process.env.E2E_ISOLATED_REDIS === "1") ||
      process.env.E2E_PRODUCTION_BUILD !== "1" || !baseURL ||
      !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname) ||
      !redisUrl || !["redis", "localhost", "127.0.0.1"].includes(new URL(redisUrl).hostname),
    "Requires a local production build with disposable Redis for comic detail fixtures",
  );

  const coverUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/kdUAAAAASUVORK5CYII=";
  const readerImage = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAFAAAAB4AQAAAABNlUhbAAAAGklEQVR42mP8zwADTAyjzFHmKHOUOcrEYAIAkioB78sU6ikAAAAASUVORK5CYII=", "base64");
  const manga = { id: "catalog-return-fixture", title: "Komik Fixture Kembali", coverUrl, isNsfw: false };
  const results = [...Array.from({ length: 18 }, (_, index) => ({
    ...manga, id: `catalog-return-other-${index}`, title: `Komik Lain ${index + 1}`,
  })), manga];
  const source = sourceRegistry.find((item) => item.id === "mangadex")!;
  const query = "catalog-return-search";
  const preferredLanguages = ["id", "en", "zz-XD"];
  const scope = sourceReadScope({ preferredLanguages, dataSaver: true });
  const detailKey = `source:${source.id}:manga:content-v2:${scope}:${manga.id}`;
  const chaptersKey = `source:${source.id}:chapters:content-v2:${scope}:${manga.id}`;
  const chapterIds = ["chapter-two", "chapter-one"];
  const pagesKey = (chapterId: string) =>
    `source:${source.id}:pages:content-v2:${scope}:${JSON.stringify([manga.id, chapterId])}`;
  const redis = new Redis(redisUrl!, { keyPrefix: redisKeyNamespace, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  let filteredRequests = 0;

  try {
    const expiresAt = Date.now() + 120_000;
    await redis.setex(detailKey, 120, JSON.stringify({
      data: { ...manga, description: "Fixture detail", genres: [] },
      expiresAt,
    }));
    await redis.setex(chaptersKey, 120, JSON.stringify({
      data: chapterIds.map((id, index) => ({
        id, mangaId: manga.id, title: `Chapter ${2 - index}`, number: 2 - index, date: "2026-11-23T12:00:00.000Z",
      })),
      expiresAt,
    }));
    await Promise.all(chapterIds.map(chapterId => redis.setex(pagesKey(chapterId), 120, JSON.stringify({
      data: { chapterId, pages: [{ index: 1, url: "https://example.test/reader.png", width: 80, height: 120 }] },
      expiresAt,
    }))));
    await page.addInitScript(({ preferredLanguages, manga }) => {
      localStorage.setItem("yomirra-onboarding", JSON.stringify({
        state: { hasCompletedOnboarding: true }, version: 0,
      }));
      localStorage.setItem("yomirra-source-preferences", JSON.stringify({
        state: { disabledSources: [], hiddenFromHomeSources: [] }, version: 2,
      }));
      localStorage.setItem("yomirra-settings", JSON.stringify({
        state: { checkOnAppStart: false, preferredLanguages, dataSaver: true }, version: 4,
      }));
      const savedAt = "2026-11-23T12:00:00.000Z";
      localStorage.setItem("yomirra-library", JSON.stringify({
        state: { items: { "saved-return-fixture": {
          ...manga, id: "saved-return-fixture", sourceId: "mangadex", mangaId: manga.id,
          isBookmarked: true, addedAt: savedAt, updatedAt: savedAt,
        } } }, version: 1,
      }));
      if (sessionStorage.getItem("seed-reader-return-fixture")) {
        localStorage.setItem("yomirra-history", JSON.stringify({ state: { items: {
          "reader-return-fixture": {
            sourceId: "mangadex", mangaId: manga.id, mangaTitle: manga.title, isNsfw: false,
            savedTitleId: "saved-return-fixture", chapterId: "chapter-one", chapterTitle: "Chapter 1",
            pageIndex: 0, totalPages: 1, readAt: Date.parse(savedAt),
          },
        } }, version: 2 }));
      }
      localStorage.setItem("manga-reader-settings", JSON.stringify({ state: {
        preferences: { readingMode: "paged", toolbarBehavior: "always-visible" }, isDesktopPanelOpen: false,
      }, version: 0 }));
    }, { preferredLanguages, manga });
    await page.context().addCookies([
      { name: "yomirra-source-languages", value: preferredLanguages.join(","), url: baseURL! },
      { name: "yomirra-data-saver", value: "true", url: baseURL! },
      { name: "yomirra-disabled-sources", value: encodeURIComponent("[]"), url: baseURL! },
    ]);
    await page.route("**/api/sources", (route) => route.fulfill({ json: { data: [source] } }));
    await page.route("**/api/sources/nsfw-ids", (route) => route.fulfill({ json: { data: [] } }));
    await page.route("**/_next/image?**", async (route) => {
      const proxy = new URL(route.request().url()).searchParams.get("url");
      if (!proxy || !proxy.includes(encodeURIComponent("https://example.test/reader.png"))) return route.fallback();
      await route.fulfill({ contentType: "image/png", body: readerImage });
    });
    await page.route("**/api/sources/mangadex/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/search")) {
        const matches = url.searchParams.get("q") === query;
        if (matches) filteredRequests++;
        return route.fulfill({ json: {
          data: { results: matches ? results : [], hasNextPage: false },
        } });
      }
      if (url.pathname.endsWith("/popular")) {
        return route.fulfill({ json: { data: { mangas: [], hasNextPage: false } } });
      }
      return route.fallback();
    });
    await page.setViewportSize({ width: 390, height: 780 });
    const catalogPath = "/library?source=mangadex";
    await page.goto(catalogPath, { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("splash-screen")).toHaveCount(0);
    const search = page.getByPlaceholder("Cari di Jelajah…");
    await search.fill(query);
    await search.press("Enter");
    const card = page.getByRole("link", { name: new RegExp(manga.title) }).first();
    await card.scrollIntoViewIfNeeded();
    const previousScroll = await page.evaluate(() => window.scrollY);
    expect(previousScroll).toBeGreaterThan(200);
    expect(filteredRequests).toBe(1);

    await card.click();
    await expect(page.getByRole("heading", { name: manga.title, exact: true })).toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname + url.search === catalogPath);
    await expect(search).toHaveValue(query);
    await expect(card).toBeVisible();
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - previousScroll)).toBeLessThan(100);
    expect(filteredRequests).toBe(1);

    await page.setViewportSize({ width: 1440, height: 900 });
    await card.click();
    const title = page.locator("#manga-detail-title-desktop");
    const read = page.getByRole("link", { name: "Mulai Baca - Chapter 1", exact: true });
    const synopsis = page.getByRole("heading", { name: "Sinopsis", exact: true });
    const chapters = page.getByRole("heading", { name: /^Daftar chapter/ });
    await expect(title).toBeVisible();
    await expect(read).toBeVisible();
    await expect(synopsis).toBeVisible();
    await expect(chapters).toBeInViewport();
    const boxes = await Promise.all([title, read, synopsis, chapters].map((element) => element.boundingBox()));
    expect(boxes.every((box) => box !== null)).toBe(true);
    expect(boxes.map((box) => box!.y)).toEqual(boxes.map((box) => box!.y).sort((a, b) => a - b));

    await page.getByRole("main").getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname + url.search === catalogPath);
    await expect(search).toHaveValue(query);
    await expect(card).toBeVisible();
    expect(filteredRequests).toBe(1);

    await page.goto("/bookmark?tab=collection", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: `Lihat katalog ${manga.title}` }).click();
    const savedPath = "/catalog/saved/saved-return-fixture";
    await expect(page).toHaveURL(savedPath);
    await page.getByRole("link", { name: "Buka", exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === `/manga/mangadex/${manga.id}` &&
      url.searchParams.get("returnTo") === savedPath);
    const back = page.getByRole("main").getByRole("button", { name: "Kembali", exact: true });
    await back.click();
    await expect(page).toHaveURL(savedPath);
    await back.click();
    await expect(page).toHaveURL("/bookmark?tab=collection");
    await page.goForward();
    await expect(page).toHaveURL(savedPath);
    await page.goBack();

    await page.evaluate(() => sessionStorage.setItem("seed-reader-return-fixture", "1"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: `Lihat katalog ${manga.title}` }).click();
    await page.getByRole("button", { name: "Lanjut baca", exact: true }).click();
    const readerPath = `/manga/mangadex/${manga.id}/read/`;
    await expect(page).toHaveURL(url => url.pathname === `${readerPath}chapter-one` &&
      url.searchParams.get("returnTo") === savedPath);
    await page.getByRole("button", { name: "Chapter berikutnya", exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === `${readerPath}chapter-two` &&
      url.searchParams.get("returnTo") === savedPath);
    await page.getByRole("button", { name: "Kembali ke detail komik", exact: true }).click();
    await expect(page).toHaveURL(savedPath);
    await back.click();
    await expect(page).toHaveURL("/bookmark?tab=collection");
    await page.goForward();
    await expect(page).toHaveURL(savedPath);
  } finally {
    try {
      await redis.del(detailKey, chaptersKey, ...chapterIds.map(pagesKey));
    } finally {
      await redis.quit();
    }
  }
});
