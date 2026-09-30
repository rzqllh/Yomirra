import { normalizeTitle } from "./title-matcher";
import type { MergedFilterList } from "@/shared/utils/filter-helpers";

export type SearchTagCategory = "genre" | "format" | "status";

export interface SearchTagDefinition {
  id: string;
  label: string;
  category: SearchTagCategory;
  aliases: string[];
}

export interface ResolvedSearchTag {
  raw: string;
  id: string;
  label: string;
  category: SearchTagCategory;
  confidence: number;
}

export interface ParsedSearchExpression {
  raw: string;
  textQuery: string;
  tags: ResolvedSearchTag[];
  unresolvedTags: string[];
}

export interface SearchCatalogBinding {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl?: string;
  latestChapter?: string;
  language?: string;
  format?: string;
  score?: number | string;
}

export interface SearchCatalogCandidate {
  canonicalKey: string;
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl?: string;
  originalTitle?: string;
  alternativeTitles?: string[];
  author?: string;
  description?: string;
  genres?: string[];
  format?: string;
  status?: string;
  score?: number;
  sourceBindings?: SearchCatalogBinding[];
}

const TAGS: SearchTagDefinition[] = [
  { id: "action", label: "Action", category: "genre", aliases: ["action", "aksi"] },
  { id: "adventure", label: "Adventure", category: "genre", aliases: ["adventure", "petualangan"] },
  { id: "comedy", label: "Comedy", category: "genre", aliases: ["comedy", "komedi"] },
  { id: "drama", label: "Drama", category: "genre", aliases: ["drama"] },
  { id: "fantasy", label: "Fantasy", category: "genre", aliases: ["fantasy", "fantasi"] },
  { id: "historical", label: "Historical", category: "genre", aliases: ["historical", "history", "sejarah"] },
  { id: "horror", label: "Horror", category: "genre", aliases: ["horror", "horor"] },
  { id: "isekai", label: "Isekai", category: "genre", aliases: ["isekai"] },
  { id: "martial-arts", label: "Martial Arts", category: "genre", aliases: ["martialarts", "martial-arts", "beladiri", "bela-diri"] },
  { id: "mystery", label: "Mystery", category: "genre", aliases: ["mystery", "misteri"] },
  { id: "psychological", label: "Psychological", category: "genre", aliases: ["psychological", "psikologis"] },
  { id: "romance", label: "Romance", category: "genre", aliases: ["romance", "romansa"] },
  { id: "school", label: "School", category: "genre", aliases: ["school", "sekolah"] },
  { id: "sci-fi", label: "Sci-Fi", category: "genre", aliases: ["scifi", "sci-fi", "sciencefiction", "fiksiilmiah"] },
  { id: "slice-of-life", label: "Slice of Life", category: "genre", aliases: ["sliceoflife", "slice-of-life", "sol", "kehidupanseharihari"] },
  { id: "sports", label: "Sports", category: "genre", aliases: ["sports", "sport", "olahraga"] },
  { id: "supernatural", label: "Supernatural", category: "genre", aliases: ["supernatural", "supranatural"] },
  { id: "thriller", label: "Thriller", category: "genre", aliases: ["thriller"] },
  { id: "manga", label: "Manga", category: "format", aliases: ["manga"] },
  { id: "manhwa", label: "Manhwa", category: "format", aliases: ["manhwa"] },
  { id: "manhua", label: "Manhua", category: "format", aliases: ["manhua"] },
  { id: "webtoon", label: "Webtoon", category: "format", aliases: ["webtoon", "webcomic"] },
  { id: "comic", label: "Comic", category: "format", aliases: ["comic", "komik"] },
  { id: "ongoing", label: "Ongoing", category: "status", aliases: ["ongoing", "berjalan", "lanjut"] },
  { id: "completed", label: "Completed", category: "status", aliases: ["completed", "complete", "tamat", "selesai"] },
  { id: "hiatus", label: "Hiatus", category: "status", aliases: ["hiatus", "jeda"] },
  { id: "cancelled", label: "Cancelled", category: "status", aliases: ["cancelled", "canceled", "dibatalkan"] },
];

function normalizeTagText(value: string): string {
  return normalizeTitle(value.replace(/^#/, ""))
    .replace(/[\s_-]+/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }

  return matrix[a.length][b.length];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - levenshtein(a, b) / maxLength;
}

function runtimeDefinitions(filters?: MergedFilterList): SearchTagDefinition[] {
  if (!filters) return TAGS;

  const from = (category: SearchTagCategory, items: Array<{ id: string; label: string }>) =>
    items.map((item) => ({
      id: item.id,
      label: item.label,
      category,
      aliases: [item.id, item.label],
    }));

  const merged = [
    ...TAGS,
    ...from("genre", filters.genres),
    ...from("format", filters.formats),
    ...from("status", filters.statuses),
  ];

  const unique = new Map<string, SearchTagDefinition>();
  for (const definition of merged) {
    const key = `${definition.category}:${definition.id}`;
    const current = unique.get(key);
    if (!current) {
      unique.set(key, definition);
      continue;
    }
    current.aliases = Array.from(new Set([...current.aliases, ...definition.aliases]));
  }
  return Array.from(unique.values());
}

export function canonicalizeFilterValue(
  category: SearchTagCategory,
  id: string,
  label: string
): { id: string; label: string } {
  const values = [normalizeTagText(id), normalizeTagText(label)].filter(Boolean);
  const match = TAGS.find((definition) => {
    if (definition.category !== category) return false;
    const aliases = [definition.id, definition.label, ...definition.aliases].map(normalizeTagText);
    return values.some((value) => aliases.includes(value));
  });

  if (match) return { id: match.id, label: match.label };

  const fallbackId = normalizeTitle(id || label)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return { id: fallbackId || id, label: label || id };
}

export function suggestSearchTags(
  input: string,
  filters?: MergedFilterList,
  limit = 6
): Array<SearchTagDefinition & { score: number }> {
  const needle = normalizeTagText(input);
  if (!needle) {
    return runtimeDefinitions(filters)
      .slice(0, limit)
      .map((item) => ({ ...item, score: 1 }));
  }

  return runtimeDefinitions(filters)
    .map((definition) => {
      const values = [definition.id, definition.label, ...definition.aliases].map(normalizeTagText);
      let score = 0;
      for (const value of values) {
        if (value === needle) score = Math.max(score, 1);
        else if (value.startsWith(needle)) score = Math.max(score, 0.92 - Math.min(0.2, (value.length - needle.length) * 0.015));
        else score = Math.max(score, similarity(needle, value));
      }
      return { ...definition, score };
    })
    .filter((item) => item.score >= 0.55)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function resolveSearchTag(
  raw: string,
  filters?: MergedFilterList
): ResolvedSearchTag | null {
  const needle = normalizeTagText(raw);
  if (!needle) return null;

  const suggestions = suggestSearchTags(needle, filters, 3);
  const best = suggestions[0];
  if (!best) return null;

  const exact = best.score === 1;
  const typoThreshold = needle.length >= 7 ? 0.84 : needle.length >= 5 ? 0.86 : 0.94;
  if (!exact && best.score < typoThreshold) return null;

  if (
    !exact &&
    suggestions[1] &&
    Math.abs(best.score - suggestions[1].score) < 0.04
  ) {
    return null;
  }

  return {
    raw,
    id: best.id,
    label: best.label,
    category: best.category,
    confidence: best.score,
  };
}

export function parseSearchExpression(
  raw: string,
  filters?: MergedFilterList
): ParsedSearchExpression {
  const tags: ResolvedSearchTag[] = [];
  const unresolvedTags: string[] = [];
  const tagPattern = /(^|\s)(#[\p{L}\p{N}_-]+)/gu;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(raw)) !== null) {
    const token = match[2];
    const resolved = resolveSearchTag(token, filters);
    if (resolved) {
      const key = `${resolved.category}:${resolved.id}`;
      if (!tags.some((tag) => `${tag.category}:${tag.id}` === key)) tags.push(resolved);
    } else {
      unresolvedTags.push(token);
    }
  }

  const resolvedTokens = new Set(tags.map((tag) => tag.raw.toLowerCase()));
  const textQuery = raw
    .replace(tagPattern, (_match, prefix: string, token: string) =>
      resolvedTokens.has(token.toLowerCase())
        ? prefix
        : `${prefix}${token.slice(1)}`
    )
    .replace(/\s+/g, " ")
    .trim();

  return { raw, textQuery, tags, unresolvedTags };
}

export function applySearchTagsToFilters(
  base: { genres: string[]; formats: string[]; status: string; sort: string },
  tags: ResolvedSearchTag[]
) {
  const genres = new Set(base.genres);
  const formats = new Set(base.formats);
  let status = base.status;

  for (const tag of tags) {
    if (tag.category === "genre") genres.add(tag.id);
    if (tag.category === "format") formats.add(tag.id);
    if (tag.category === "status") status = tag.id;
  }

  return {
    genres: Array.from(genres),
    formats: Array.from(formats),
    status,
    sort: base.sort,
  };
}

export function buildHardFilterTags(
  active: { genres: string[]; formats: string[]; status: string },
  filters: MergedFilterList
): ResolvedSearchTag[] {
  const labelFor = (category: SearchTagCategory, id: string) => {
    const list =
      category === "genre"
        ? filters.genres
        : category === "format"
          ? filters.formats
          : filters.statuses;
    return list.find((item) => item.id.toLowerCase() === id.toLowerCase())?.label ?? id;
  };

  const tags: ResolvedSearchTag[] = [
    ...active.genres.map((id) => ({
      raw: `#${id}`,
      id,
      label: labelFor("genre", id),
      category: "genre" as const,
      confidence: 1,
    })),
    ...active.formats.map((id) => ({
      raw: `#${id}`,
      id,
      label: labelFor("format", id),
      category: "format" as const,
      confidence: 1,
    })),
  ];

  if (active.status) {
    tags.push({
      raw: `#${active.status}`,
      id: active.status,
      label: labelFor("status", active.status),
      category: "status",
      confidence: 1,
    });
  }

  return tags;
}

export function isSourceCompatibleWithTags(
  sourceId: string,
  tags: ResolvedSearchTag[],
  filters: MergedFilterList
): boolean {
  if (tags.length === 0) return true;

  for (const tag of tags) {
    const list =
      tag.category === "genre"
        ? filters.genres
        : tag.category === "format"
          ? filters.formats
          : filters.statuses;
    const match = list.find((item) => item.id === tag.id);
    if (!match || !match.supportedBy.includes(sourceId)) return false;
  }
  return true;
}

export function lexicalSearchScore(query: string, candidate: SearchCatalogCandidate): number {
  const normalizedQuery = normalizeTitle(query);
  if (!normalizedQuery) return 0;

  const values = [
    candidate.title,
    candidate.originalTitle,
    ...(candidate.alternativeTitles ?? []),
    candidate.author,
  ]
    .filter(Boolean)
    .map((value) => normalizeTitle(String(value)));

  let best = 0;
  for (const value of values) {
    if (value === normalizedQuery) best = Math.max(best, 1);
    else if (value.startsWith(normalizedQuery)) best = Math.max(best, 0.95);
    else if (value.includes(normalizedQuery)) best = Math.max(best, 0.9);
    else best = Math.max(best, similarity(normalizedQuery, value));
  }
  return best;
}

export function shouldUseSemanticSearch(query: string): boolean {
  const clean = normalizeTitle(query);
  if (!clean) return false;
  const wordCount = clean.split(" ").filter(Boolean).length;
  return wordCount >= 4 || clean.length >= 28;
}

export function buildCatalogText(candidate: SearchCatalogCandidate): string {
  const parts = [
    candidate.title,
    candidate.originalTitle,
    ...(candidate.alternativeTitles ?? []),
    candidate.author ? `Kreator: ${candidate.author}` : "",
    candidate.genres?.length ? `Genre: ${candidate.genres.join(", ")}` : "",
    candidate.format ? `Format: ${candidate.format}` : "",
    candidate.status ? `Status: ${candidate.status}` : "",
    candidate.description?.slice(0, 1200) ?? "",
  ].filter(Boolean);

  return parts.join("\n");
}

export function candidateMatchesTags(
  candidate: SearchCatalogCandidate,
  tags: ResolvedSearchTag[]
): boolean {
  for (const tag of tags) {
    if (tag.category === "genre") {
      const genres = (candidate.genres ?? []).map(normalizeTagText);
      if (!genres.includes(normalizeTagText(tag.id)) && !genres.includes(normalizeTagText(tag.label))) {
        return false;
      }
    }
    if (tag.category === "format") {
      if (normalizeTagText(candidate.format ?? "") !== normalizeTagText(tag.id)) return false;
    }
    if (tag.category === "status") {
      const status = canonicalizeFilterValue("status", candidate.status ?? "", candidate.status ?? "").id;
      if (status !== tag.id) return false;
    }
  }
  return true;
}

export function rankHybridScore(
  query: string,
  candidate: SearchCatalogCandidate,
  semanticScore?: number
): number {
  const lexical = lexicalSearchScore(query, candidate);
  if (!shouldUseSemanticSearch(query) || typeof semanticScore !== "number") return lexical;
  const exactBonus = lexical >= 0.98 ? 0.5 : 0;
  return lexical * 0.45 + semanticScore * 0.55 + exactBonus;
}
