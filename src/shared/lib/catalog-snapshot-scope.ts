import {
  CONTENT_PREFERENCE_COOKIE,
  DATA_SAVER_COOKIE,
  LANGUAGE_PREFERENCE_COOKIE,
} from "@/shared/sources/content-policy";

const scopeCookies = [
  CONTENT_PREFERENCE_COOKIE,
  DATA_SAVER_COOKIE,
  LANGUAGE_PREFERENCE_COOKIE,
  "yomirra-disabled-sources",
  "yomirra_dynamic_sources_urls",
];

export function catalogSnapshotScope(readCookie: (name: string) => string | undefined) {
  return scopeCookies.map(readCookie);
}

export function readBrowserCatalogScope() {
  if (typeof document === "undefined") return undefined;
  const cookies = new Map<string, string>();
  for (const cookie of document.cookie.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    try {
      cookies.set(cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1)));
    } catch {
      // Next.js also skips cookies with a malformed encoding.
    }
  }
  return catalogSnapshotScope((name) => cookies.get(name));
}
