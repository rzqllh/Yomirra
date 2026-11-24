import type { Chapter } from "@/shared/sources/source-types";

export interface ChapterNumberEvidence {
  number: number;
  volume?: number;
}

/** Parse only explicit numeric chapter labels, never an opaque provider ID,
 * list index, special, or a partial number extracted from arbitrary text. */
export function readChapterNumberEvidence(label: string | undefined): ChapterNumberEvidence | null {
  if (typeof label !== "string" || !label) return null;
  const value = label.trim().replace(/\s+\[(?:EN|ID)\]$/i, "");
  const match = /^(?:(?:vol(?:ume)?\.?\s*)(\d+)\s*[-: ]\s*)?(?:(?:chapter|chap|ch|episode|ep)\.?\s*|#\s*)?(\d+(?:\.\d+)?)\s*$/i.exec(value);
  if (!match) return null;
  const number = Number(match[2]);
  const volume = match[1] === undefined ? undefined : Number(match[1]);
  if (!Number.isFinite(number) || number < 0 || (volume !== undefined && !Number.isSafeInteger(volume))) return null;
  return { number, volume };
}

/** Preserve explicit upstream numbering/volume rather than guessing from
 * display labels (e.g. localized titles or MangaDex's [EN] annotation). */
export function chapterNavigationLabel(chapter: Chapter | undefined): string | undefined {
  if (!chapter) return undefined;
  const title = readChapterNumberEvidence(chapter.title);
  const explicit = chapter.chapterNumber === undefined ? null : readChapterNumberEvidence(chapter.chapterNumber);
  if (chapter.chapterNumber !== undefined && !explicit) return undefined;
  if (title && explicit && (title.number !== explicit.number ||
      (title.volume !== undefined && explicit.volume !== undefined && title.volume !== explicit.volume))) return undefined;
  const observed = explicit ?? title;
  if (!observed) return undefined;
  const labelVolume = title?.volume ?? explicit?.volume;
  const volume = chapter.volume === undefined ? labelVolume :
    typeof chapter.volume === "string" && /^\d+$/.test(chapter.volume.trim()) ? Number(chapter.volume) : null;
  if (volume === null || (volume !== undefined && !Number.isSafeInteger(volume)) ||
      (labelVolume !== undefined && volume !== labelVolume)) return undefined;
  return (volume === undefined ? "" : "Vol. " + volume + " ") + "Chapter " + observed.number;
}

export type AlternateChapterMapping =
  | { type: "EXACT"; chapter: Chapter; number: number }
  | { type: "AMBIGUOUS"; number: number }
  | { type: "UNMAPPED" };

/** Numeric resemblance is not proof of release equivalence. This is only
 * a navigation suggestion after explicit source selection. Never write progress.
 * Preserve ambiguity even when some editions are locked or lack access evidence. */
export function suggestAlternateChapter(
  currentTitle: string,
  targetMangaId: string,
  chapters: readonly Chapter[],
): AlternateChapterMapping {
  const current = readChapterNumberEvidence(currentTitle);
  if (!current || !targetMangaId || !Array.isArray(chapters)) return { type: "UNMAPPED" };
  const matches: Chapter[] = [];
  for (const chapter of chapters) {
    if (!chapter || chapter.mangaId !== targetMangaId || typeof chapter.id !== "string" ||
        !chapter.id.trim() || typeof chapter.title !== "string") continue;
    const title = readChapterNumberEvidence(chapter.title);
    // Explicit title or provider chapterNumber is necessary; number alone may
    // be an invented list index. Conflicting evidence makes the row unusable.
    const explicit = chapter.chapterNumber !== undefined
      ? readChapterNumberEvidence(chapter.chapterNumber) : null;
    if (chapter.chapterNumber !== undefined && !explicit) continue;
    if (!title && !explicit) continue;
    if (title && explicit && (title.number !== explicit.number ||
        (title.volume !== undefined && explicit.volume !== undefined && title.volume !== explicit.volume))) continue;
    const observed = title ?? explicit!;
    if (observed.number !== current.number) continue;
    const rawVolume = chapter.volume;
    const labelVolume = title?.volume ?? explicit?.volume;
    const volume = rawVolume === undefined ? labelVolume :
      typeof rawVolume === "string" && /^\d+$/.test(rawVolume.trim()) ? Number(rawVolume) : null;
    if (volume === null || (volume !== undefined && !Number.isSafeInteger(volume)) ||
        (labelVolume !== undefined && volume !== labelVolume)) continue;
    if (current.volume !== undefined && volume !== current.volume) continue;
    matches.push(chapter);
  }
  if (matches.length > 1) return { type: "AMBIGUOUS", number: current.number };
  // A missing lock flag is not affirmative evidence of an unlocked chapter.
  if (matches.length !== 1 || matches[0].isLocked !== false) return { type: "UNMAPPED" };
  return { type: "EXACT", chapter: matches[0], number: current.number };
}
