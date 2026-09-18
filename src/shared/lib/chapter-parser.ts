/**
 * Chapter number parsing and cross-source progress mapping.
 *
 * ChapterMapResult semantics:
 *   EXACT    — identical chapter number; auto-applied.
 *   PROBABLE — numerically close; requires user confirmation.
 *   AMBIGUOUS — multiple candidates equally close; requires user selection.
 *   UNMAPPED — no safe mapping found; legacy progress preserved.
 *
 * Rule: progress must never be fabricated. UNMAPPED must not default to chapter 1.
 */

export type ChapterMapResult =
  | { type: "EXACT"; targetChapterId: string; chapterNumber: number }
  | { type: "PROBABLE"; targetChapterId: string; chapterNumber: number; delta: number }
  | { type: "AMBIGUOUS"; candidates: Array<{ chapterId: string; chapterNumber: number }> }
  | { type: "UNMAPPED"; chapterNumber?: number | null };

export interface ChapterMeta {
  chapterId: string;
  chapterTitle?: string;
  title?: string;
  chapterNumber?: number; // pre-parsed, if available from adapter
  volume?: string | number;
}

export type SourceChapterList = ChapterMeta[];

// Parsing


/**
 * Parses a chapter number from a chapter title or ID string.
 * Handles: "Chapter 14", "Ch. 14.5", "14", "Vol.2 Ch.3", "Chap 15", "042", etc.
 *
 * Returns null for specials/extras/one-shots that have no numeric identity.
 */
export function parseChapterNumber(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Filter out pure non-numeric specials
  if (/^(?:extra|omake|special|prologue|epilogue|oneshot|side\s*story)/i.test(trimmed)) {
    return null;
  }

  // Try explicit chapter markers first: "Chapter 14", "Ch. 14.5", "Chap 15", "Ch 7", "ch.3.1"
  const chMarker = /(?:ch(?:ap(?:ter)?)?[.\s]*)([\d]+(?:\.[\d]+)?)/i.exec(trimmed);
  if (chMarker) return parseFloat(chMarker[1]);

  // Try bare number or number with leading #, zeros: "042", "7", "#15"
  const bare = /^#?\s*0*([\d]+(?:\.[\d]+)?)\s*$/.exec(trimmed);
  if (bare) return parseFloat(bare[1]);

  // Try number at the start after optional prefix
  const leading = /^(?:[a-z]+[.\s]*)?(\d+(?:\.\d+)?)/i.exec(trimmed);
  if (leading) return parseFloat(leading[1]);

  return null;
}

/** Alias for parseChapterNumber for backwards/test compatibility */
export const extractChapterNumber = parseChapterNumber;

/**
 * Resolves the chapter number for a ChapterMeta, preferring the pre-parsed
 * `chapterNumber` field, then falling back to parsing `chapterTitle` or `title`.
 */
export function resolveChapterNumber(chapter: ChapterMeta): number | null {
  if (chapter.chapterNumber != null && isFinite(chapter.chapterNumber)) {
    return chapter.chapterNumber;
  }
  const title = chapter.chapterTitle || chapter.title;
  if (title) {
    return parseChapterNumber(title);
  }
  // Last resort: try the chapterId itself
  return parseChapterNumber(chapter.chapterId);
}

/**
 * Finds a chapter by its exact chapter number in a chapter list.
 */
export function findChapterByNumber(
  chapterNumber: number,
  chapters: ChapterMeta[]
): ChapterMeta | null {
  for (const ch of chapters) {
    const num = resolveChapterNumber(ch);
    if (num !== null && Math.abs(num - chapterNumber) < EXACT_TOLERANCE) {
      return ch;
    }
  }
  return null;
}

// Cross-source chapter progress mapping


const EXACT_TOLERANCE = 0.001;
const PROBABLE_TOLERANCE = 1.0; // e.g. Ch 9 vs Ch 10 — within 1 chapter proximity

/**
 * Maps a known last-read chapter number or chapter title to the best matching chapter
 * in a target source's chapter list.
 *
 * @param lastRead        - The parsed chapter number or title string the user last read.
 * @param targetChapters  - Full chapter list from the target source.
 */
export function mapChapterProgress(
  lastRead: number | string,
  targetChapters: ChapterMeta[]
): ChapterMapResult {
  const lastReadNumber = typeof lastRead === "number" ? lastRead : parseChapterNumber(lastRead);
  if (lastReadNumber === null) {
    return { type: "UNMAPPED", chapterNumber: null };
  }

  if (!targetChapters.length) {
    return { type: "UNMAPPED", chapterNumber: lastReadNumber };
  }

  // Build a list of (number, meta) pairs, dropping un-parseable chapters
  const numbered: Array<{ number: number; meta: ChapterMeta }> = [];
  for (const ch of targetChapters) {
    const n = resolveChapterNumber(ch);
    if (n !== null) {
      numbered.push({ number: n, meta: ch });
    }
  }

  if (!numbered.length) {
    return { type: "UNMAPPED", chapterNumber: lastReadNumber };
  }

  // Find exact matches
  const exact = numbered.filter(
    (x) => Math.abs(x.number - lastReadNumber) < EXACT_TOLERANCE
  );
  if (exact.length === 1) {
    return {
      type: "EXACT",
      targetChapterId: exact[0].meta.chapterId,
      chapterNumber: exact[0].number,
    };
  }
  if (exact.length > 1) {
    // Duplicate chapter numbers in target source — ambiguous
    return {
      type: "AMBIGUOUS",
      candidates: exact.map((x) => ({
        chapterId: x.meta.chapterId,
        chapterNumber: x.number,
      })),
    };
  }

  // Find probable matches within tolerance
  const probable = numbered.filter(
    (x) => Math.abs(x.number - lastReadNumber) <= PROBABLE_TOLERANCE
  );
  if (probable.length === 1) {
    return {
      type: "PROBABLE",
      targetChapterId: probable[0].meta.chapterId,
      chapterNumber: probable[0].number,
      delta: Math.abs(probable[0].number - lastReadNumber),
    };
  }
  if (probable.length > 1) {
    return {
      type: "AMBIGUOUS",
      candidates: probable.map((x) => ({
        chapterId: x.meta.chapterId,
        chapterNumber: x.number,
      })),
    };
  }

  // Nothing close enough
  return { type: "UNMAPPED", chapterNumber: lastReadNumber };
}
