import type { SourceFilter, FilterList } from "@/shared/sources/source-types";
import type { MangaDexTag, MangaDexTagListResponse } from "./types";
import { withCache } from "@/server/lib/cache/redis-cache";
import { createMangaDexTransport } from "./transport";

const TAG_API = "https://api.mangadex.org/manga/tag";
const TAG_CACHE_KEY = "mangadex:tags";
const TAG_CACHE_TTL = 86400; // 24 hours

function pickTagName(tag: MangaDexTag): string {
  return tag.attributes.name.en || Object.values(tag.attributes.name)[0] || "";
}

type MangaDexTransport = ReturnType<typeof createMangaDexTransport>;

export function createMangaDexTagFetcher(
  transport: MangaDexTransport = createMangaDexTransport()
) {
  return async function fetchTags(): Promise<MangaDexTag[]> {
    const context = transport.createContext(10000);
    const { response } = await transport.request(
      new URL(TAG_API),
      { headers: { Accept: "application/json" }, cache: "no-store" },
      context
    );
    if (!response.ok) throw new Error(`Failed to fetch MangaDex tags: ${response.status}`);
    const json: MangaDexTagListResponse = await response.json();
    return json.data;
  };
}

const fetchTags = createMangaDexTagFetcher();

let cachedFilters: FilterList | null = null;

export async function getMangaDexFilters(): Promise<FilterList> {
  if (cachedFilters) return cachedFilters;

  const tags = await withCache(TAG_CACHE_KEY, fetchTags, TAG_CACHE_TTL);

  const genres: SourceFilter[] = [];
  const formats: SourceFilter[] = [];

  for (const tag of tags) {
    const filter: SourceFilter = { id: tag.id, name: pickTagName(tag) };
    switch (tag.attributes.group) {
      case "genre":
        genres.push(filter);
        break;
      case "theme":
        // Merge themes into genres for simplicity in UI
        genres.push(filter);
        break;
      case "format":
        formats.push(filter);
        break;
      // "content" tags skipped — handled separately via contentRating param
    }
  }

  // Sort alphabetically
  genres.sort((a, b) => a.name.localeCompare(b.name));
  formats.sort((a, b) => a.name.localeCompare(b.name));

  cachedFilters = {
    genres,
    formats,
    statuses: [
      { id: "ongoing", name: "Ongoing" },
      { id: "completed", name: "Completed" },
      { id: "hiatus", name: "Hiatus" },
      { id: "cancelled", name: "Cancelled" },
    ],
    sorts: [
      { id: "followedCount", name: "Populer" },
      { id: "latestUploadedChapter", name: "Terbaru" },
      { id: "relevance", name: "Relevansi" },
      { id: "rating", name: "Rating Tertinggi" },
      { id: "createdAt", name: "Terbaru Ditambahkan" },
    ],
  };

  return cachedFilters;
}

/** Lookup tag UUID by name (case-insensitive) */
export async function getTagId(name: string): Promise<string | undefined> {
  const tags = await withCache(TAG_CACHE_KEY, fetchTags, TAG_CACHE_TTL);
  const lower = name.toLowerCase();
  return tags.find(t => pickTagName(t).toLowerCase() === lower)?.id;
}
