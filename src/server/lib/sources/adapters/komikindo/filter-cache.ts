import * as cheerio from "cheerio";
import type { SourceFilter, FilterList } from "@/shared/sources/source-types";
import { withCache } from "@/server/lib/cache/redis-cache";

const KOMIKINDO_MANGA_URL = "https://komikindo.ch/manga/";
const KOMIKINDO_FILTER_CACHE_KEY = "komikindo:filters";
const FILTER_CACHE_TTL = 86400; // 24 hours

let cachedFilters: FilterList | null = null;

async function fetchFilters(): Promise<FilterList> {
  const res = await fetch(KOMIKINDO_MANGA_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Referer": "https://komikindo.ch/",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Komikindo filters: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const genres: SourceFilter[] = [];
  $('ul.genrez li input').each((_, el) => {
    const id = $(el).val() as string;
    const name = $(el).parent().text().trim();
    if (id && name) {
      genres.push({ id, name });
    }
  });

  const statuses: SourceFilter[] = [];
  $('select[name="status"] option').each((_, el) => {
    const id = $(el).val() as string;
    const name = $(el).text().trim();
    if (id && name && id !== "0" && id !== "") {
      statuses.push({ id, name });
    }
  });

  const formats: SourceFilter[] = [];
  $('select[name="type"] option').each((_, el) => {
    const id = $(el).val() as string;
    const name = $(el).text().trim();
    if (id && name && id !== "0" && id !== "") {
      formats.push({ id, name });
    }
  });

  const sorts: SourceFilter[] = [];
  $('select[name="order"] option').each((_, el) => {
    const id = $(el).val() as string;
    const name = $(el).text().trim();
    if (id && name && id !== "0" && id !== "") {
      // mapping their values if necessary, but we keep id as they have it (update, popular, etc.)
      sorts.push({ id, name });
    }
  });

  // Default fallbacks if scraping fails for sorts
  if (sorts.length === 0) {
    sorts.push(
      { id: "popular", name: "Populer" },
      { id: "update", name: "Terbaru" },
      { id: "title", name: "A-Z" }
    );
  }

  // Sort alphabetically
  genres.sort((a, b) => a.name.localeCompare(b.name));
  formats.sort((a, b) => a.name.localeCompare(b.name));
  statuses.sort((a, b) => a.name.localeCompare(b.name));

  return { genres, formats, statuses, sorts };
}

export async function getKomikindoFilters(): Promise<FilterList> {
  if (cachedFilters) return cachedFilters;

  const filters = await withCache(KOMIKINDO_FILTER_CACHE_KEY, fetchFilters, FILTER_CACHE_TTL);
  cachedFilters = filters;

  return cachedFilters;
}
