import type {
  KomikNesiaChapter,
  KomikNesiaChapterRef,
  KomikNesiaDetail,
  KomikNesiaGenreRef,
  KomikNesiaItem,
  KomikNesiaPage,
} from "./types";

const SCHEMA_MISMATCH = "KOMIKNESIA_SCHEMA_MISMATCH";
const ISO_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/;
const MAX_DATE_SECONDS = 8_640_000_000_000;

type JsonRecord = Record<string, unknown>;

function mismatch(path: string): never {
  throw new Error(`${SCHEMA_MISMATCH}: ${path}`);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) mismatch(path);
  return value;
}

function has(record: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function requiredString(record: JsonRecord, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    mismatch(`${path}.${key}`);
  }
  return value;
}

function optionalString(
  record: JsonRecord,
  key: string,
  path: string
): string | undefined {
  if (!has(record, key) || record[key] === undefined) return undefined;
  if (typeof record[key] !== "string") mismatch(`${path}.${key}`);
  return record[key];
}

function optionalStringOrNumber(
  record: JsonRecord,
  key: string,
  path: string
): string | number | undefined {
  if (!has(record, key) || record[key] === undefined) return undefined;
  const value = record[key];
  if (typeof value !== "string" && typeof value !== "number") {
    mismatch(`${path}.${key}`);
  }
  return value;
}

function optionalNumber(
  record: JsonRecord,
  key: string,
  path: string
): number | undefined {
  if (!has(record, key) || record[key] === undefined) return undefined;
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    mismatch(`${path}.${key}`);
  }
  return value;
}

function optionalTimestamp(
  record: JsonRecord,
  key: string,
  path: string
): string | undefined {
  if (!has(record, key) || record[key] === undefined) {
    return undefined;
  }

  const value = record[key];
  if (typeof value === "string") {
    const match = ISO_TIMESTAMP.exec(value);
    if (!match) mismatch(`${path}.${key}`);

    const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
    const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;

    if (
      day < 1 || day > daysInMonth ||
      hour > 23 || minute > 59 || second > 59 ||
      offsetHour > 23 || offsetMinute > 59 ||
      !Number.isFinite(Date.parse(value))
    ) {
      mismatch(`${path}.${key}`);
    }
    return value;
  }

  if (isRecord(value)) {
    const time = value.time;
    if (
      typeof time !== "number" ||
      !Number.isSafeInteger(time) ||
      time < 0 ||
      time > MAX_DATE_SECONDS
    ) {
      mismatch(`${path}.${key}.time`);
    }
    return new Date(time * 1000).toISOString();
  }

  return mismatch(`${path}.${key}`);
}

function parseGenres(value: unknown, path: string): string[] | KomikNesiaGenreRef[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) mismatch(path);

  if (value.every((entry) => typeof entry === "string")) {
    return value;
  }

  if (!value.every(isRecord)) mismatch(path);

  return value.map((genre, index) => {
    return {
      id: optionalStringOrNumber(genre, "id", `${path}[${index}]`),
      name: optionalString(genre, "name", `${path}[${index}]`),
      slug: optionalString(genre, "slug", `${path}[${index}]`),
    };
  });
}

function parseCommonItem(record: JsonRecord, path: string): KomikNesiaItem {
  return {
    id: optionalStringOrNumber(record, "id", path),
    title: requiredString(record, "title", path),
    slug: requiredString(record, "slug", path),
    cover: optionalString(record, "cover", path),
    thumbnail: optionalString(record, "thumbnail", path),
    status: optionalString(record, "status", path),
    genres: parseGenres(record.genres, `${path}.genres`),
    author: optionalString(record, "author", path),
    artist: optionalString(record, "artist", path),
    rating: optionalStringOrNumber(record, "rating", path),
    totalChapters: optionalNumber(record, "totalChapters", path),
  };
}

function parseLegacyChapter(record: JsonRecord, path: string): KomikNesiaChapter {
  return {
    id: optionalStringOrNumber(record, "id", path),
    slug: optionalString(record, "slug", path),
    number: optionalStringOrNumber(record, "number", path),
    title: optionalString(record, "title", path),
    releasedAt: optionalTimestamp(record, "releasedAt", path),
    createdAt: optionalTimestamp(record, "createdAt", path),
    updatedAt: optionalTimestamp(record, "updatedAt", path),
  };
}

function parseCurrentChapter(record: JsonRecord, path: string): KomikNesiaChapter {
  return {
    id: optionalStringOrNumber(record, "id", path),
    slug: optionalString(record, "slug", path),
    number: optionalStringOrNumber(record, "chapter_number", path),
    title: optionalString(record, "title", path),
    createdAt: optionalTimestamp(record, "created_at", path),
    updatedAt: optionalTimestamp(record, "updated_at", path),
  };
}

function parseLegacyChapterRef(value: unknown, path: string): KomikNesiaChapterRef | undefined {
  if (value === undefined || value === null) return undefined;
  return parseLegacyChapter(recordAt(value, path), path);
}

function parseCurrentChapterRef(value: unknown, path: string): KomikNesiaChapterRef {
  const record = recordAt(value, path);
  return {
    id: optionalStringOrNumber(record, "id", path),
    slug: optionalString(record, "slug", path),
    number: optionalStringOrNumber(record, "number", path),
    title: optionalString(record, "title", path),
    createdAt: optionalTimestamp(record, "created_at", path),
    updatedAt: optionalTimestamp(record, "updated_at", path),
  };
}

function parseLegacyItem(value: unknown, path: string): KomikNesiaItem {
  const record = recordAt(value, path);
  return {
    ...parseCommonItem(record, path),
    type: optionalString(record, "type", path),
    description: optionalString(record, "description", path),
    latestChapter: parseLegacyChapterRef(record.latestChapter, `${path}.latestChapter`),
    createdAt: optionalTimestamp(record, "createdAt", path),
    updatedAt: optionalTimestamp(record, "updatedAt", path),
  };
}

function parseCurrentContentsItem(value: unknown, path: string): KomikNesiaItem {
  const record = recordAt(value, path);
  let latestChapter: KomikNesiaChapterRef | undefined;

  if (has(record, "lastChapters")) {
    if (!Array.isArray(record.lastChapters)) mismatch(`${path}.lastChapters`);
    if (record.lastChapters.length > 0) {
      latestChapter = parseCurrentChapterRef(
        record.lastChapters[0],
        `${path}.lastChapters[0]`
      );
    }
  }

  return {
    ...parseCommonItem(record, path),
    type: optionalString(record, "content_type", path),
    description: optionalString(record, "sinopsis", path),
    latestChapter,
    createdAt: optionalTimestamp(record, "created_at", path),
    updatedAt: optionalTimestamp(record, "updated_at", path),
  };
}

function parseCurrentSearchItem(value: unknown, path: string): KomikNesiaItem {
  const record = recordAt(value, path);
  if (has(record, "last_chapter") && record.last_chapter !== null) {
    mismatch(`${path}.last_chapter`);
  }

  return {
    ...parseCommonItem(record, path),
    type: optionalString(record, "content_type", path),
    description: optionalString(record, "synopsis", path),
    createdAt: optionalTimestamp(record, "created_at", path),
    updatedAt: optionalTimestamp(record, "updated_at", path),
  };
}

function parsePageCount(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    mismatch(path);
  }
  return value;
}

export function parseKomikNesiaContents(raw: unknown): KomikNesiaPage {
  const root = recordAt(raw, "contents");
  if (!Array.isArray(root.data)) mismatch("contents.data");

  if (has(root, "meta")) {
    const meta = recordAt(root.meta, "contents.meta");
    return {
      items: root.data.map((item, index) =>
        parseCurrentContentsItem(item, `contents.data[${index}]`)
      ),
      totalPages: parsePageCount(meta.total_pages, "contents.meta.total_pages"),
    };
  }

  return {
    items: root.data.map((item, index) =>
      parseLegacyItem(item, `contents.data[${index}]`)
    ),
    totalPages: parsePageCount(root.totalPages, "contents.totalPages"),
  };
}

export function parseKomikNesiaSearch(raw: unknown): KomikNesiaPage {
  const root = recordAt(raw, "search");
  if (!Array.isArray(root.manga)) mismatch("search.manga");
  const schemas = new Set(
    root.manga.map((item) => {
      const record = recordAt(item, "search.manga[]");
      return has(record, "content_type") ||
        has(record, "synopsis") ||
        has(record, "last_chapter")
        ? "current"
        : "legacy";
    })
  );
  if (schemas.size > 1) mismatch("search.manga");
  const isCurrent = schemas.has("current");

  return {
    items: root.manga.map((item, index) =>
      isCurrent
        ? parseCurrentSearchItem(item, `search.manga[${index}]`)
        : parseLegacyItem(item, `search.manga[${index}]`)
    ),
    totalPages: parsePageCount(root.totalPages, "search.totalPages"),
  };
}

export function parseKomikNesiaDetail(raw: unknown): KomikNesiaDetail {
  const root = recordAt(raw, "detail");

  if (has(root, "data")) {
    const detail = recordAt(root.data, "detail.data");
    const item = parseLegacyItem(detail, "detail.data");
    let chapters: KomikNesiaChapter[] | undefined;
    if (has(detail, "chapters") && detail.chapters !== undefined) {
      if (!Array.isArray(detail.chapters)) mismatch("detail.data.chapters");
      chapters = detail.chapters.map((chapter, index) =>
        parseLegacyChapter(
          recordAt(chapter, `detail.data.chapters[${index}]`),
          `detail.data.chapters[${index}]`
        )
      );
    }
    return { ...item, chapters };
  }

  const item = {
    ...parseCommonItem(root, "detail"),
    type: optionalString(root, "content_type", "detail"),
    description: optionalString(root, "synopsis", "detail"),
    createdAt: optionalTimestamp(root, "created_at", "detail"),
    updatedAt: optionalTimestamp(root, "updated_at", "detail"),
  };

  let chapters: KomikNesiaChapter[] | undefined;
  if (has(root, "chapters") && root.chapters !== undefined) {
    if (!Array.isArray(root.chapters)) mismatch("detail.chapters");
    chapters = root.chapters.map((chapter, index) =>
      parseCurrentChapter(
        recordAt(chapter, `detail.chapters[${index}]`),
        `detail.chapters[${index}]`
      )
    );
  }

  return { ...item, chapters };
}
