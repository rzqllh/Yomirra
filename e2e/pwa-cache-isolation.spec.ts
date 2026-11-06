import { expect, test } from "@playwright/test";
import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  PAGES_CACHE_NAME,
  SAFE_OFFLINE_PAGE_HEADER,
  SAFE_OFFLINE_PAGE_SCOPE,
} from "../src/shared/lib/pwa-cache-policy";
import { CONTENT_PREFERENCE_COOKIE } from "../src/shared/sources/content-policy";

test("offline cache retains downloads and only stores safe documents", async ({ context, page, baseURL }) => {
  test.skip(process.env.E2E_PRODUCTION_BUILD !== "1", "Requires a production service worker build");

  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0,
    }));
  });
  await page.goto("/settings");
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const offlineImage = "/offline-images/regression/1";
  const unsafeImage = "/offline-images/regression/legacy.svg";
  await page.evaluate(async ({ offlineImage, unsafeImage, downloads }) => {
    const cache = await caches.open(downloads);
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2X8AAAAASUVORK5CYII="), (char) => char.charCodeAt(0));
    await cache.put(new URL(offlineImage, location.origin).href, new Response(png, {
      headers: { "content-type": "image/png" },
    }));
    await cache.put(new URL(unsafeImage, location.origin).href, new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', {
      headers: { "content-type": "image/svg+xml" },
    }));
    const legacy = await caches.open("pages-rsc");
    await legacy.put("/settings", new Response("legacy-cookie-dependent-payload"));
  }, { offlineImage, unsafeImage, downloads: EXPLICIT_DOWNLOADS_CACHE_NAME });

  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js?cache-upgrade-regression=1");
  });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL))
    .toContain("cache-upgrade-regression=1");
  const safe = await page.reload();
  expect(safe?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBe(SAFE_OFFLINE_PAGE_SCOPE);
  await expect.poll(() => page.evaluate(async (name) => {
    const cache = await caches.open(name);
    return (await cache.match("/settings"))?.headers.get("x-yomirra-offline-cache");
  }, PAGES_CACHE_NAME)).toBe(SAFE_OFFLINE_PAGE_SCOPE);
  await expect.poll(() => page.evaluate(() => caches.has("pages-rsc"))).toBe(false);

  expect((await page.goto(unsafeImage))?.status()).toBe(404);
  await context.addCookies([
    { name: CONTENT_PREFERENCE_COOKIE, value: "false", url: baseURL! },
    { name: "yomirra_dynamic_sources_urls", value: "[]", url: baseURL! },
  ]);
  const optedIn = await page.goto("/settings?cache-check=opted-in");
  expect(optedIn?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBeUndefined();
  expect(await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    return Boolean(await cache.match("/settings?cache-check=opted-in"));
  }, PAGES_CACHE_NAME)).toBe(false);

  const downloads = await page.goto("/downloads");
  expect(downloads?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBe(SAFE_OFFLINE_PAGE_SCOPE);
  await expect.poll(() => page.evaluate(async (name) => {
    return Boolean(await (await caches.open(name)).match("/downloads"));
  }, PAGES_CACHE_NAME)).toBe(true);

  await context.setOffline(true);
  const offlineDownloads = await context.newPage();
  await offlineDownloads.goto("/downloads");
  await expect(offlineDownloads.getByRole("heading", { name: "Unduhan", exact: true })).toBeVisible();
  const image = await offlineDownloads.evaluate(async ({ url, cacheName }) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(new URL(url, location.origin).href);
    const response = await fetch(url, { headers: { Accept: "image/png" } });
    return {
      cachedContentType: cached?.headers.get("content-type"),
      contentType: response.headers.get("content-type"),
      status: response.status,
    };
  }, { url: offlineImage, cacheName: EXPLICIT_DOWNLOADS_CACHE_NAME });
  expect(image).toEqual({ cachedContentType: "image/png", contentType: "image/png", status: 200 });
  expect(await page.evaluate(async (url) => fetch(url).then((response) => response.ok, () => false), unsafeImage)).toBe(false);
  expect(await page.evaluate(async () => fetch("/api/health/live").then(() => false, () => true))).toBe(true);
  const cached = await page.goto("/settings");
  expect(cached?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBe(SAFE_OFFLINE_PAGE_SCOPE);
});
