import { SourceRef, LibraryItem } from "@/shared/store/library-store";
import { HistoryItem } from "@/shared/store/history-store";
import {
  mapChapterProgress,
  findNearestSafeChapter,
  type ChapterMapResult,
  type ChapterMeta,
} from "./chapter-parser";
import {
  rankCandidates,
  type MatchConfidence,
  type TitleCandidate,
} from "./title-matcher";
import { SourceErrorCode } from "@/server/lib/sources/error";

export type SourceFallbackStatus = "NO_FALLBACK" | "AUTO_SAFE" | "CONFIRM_REQUIRED";

export type SourceMigrationStatus =
  | "PROPOSED"
  | "AUTO_APPLIED"
  | "CONFIRM_REQUIRED"
  | "CONFIRMED"
  | "ROLLED_BACK";

export interface SourceMigrationSnapshot {
  id: string;
  savedTitleId: string;
  fromSourceId: string;
  fromMangaId: string;
  fromChapterId?: string;
  fromChapterTitle?: string;
  fromChapterNumber?: number;
  fromPageIndex?: number;
  toSourceId?: string;
  toMangaId?: string;
  toChapterId?: string;
  toChapterTitle?: string;
  toChapterNumber?: number;
  titleConfidence: MatchConfidence;
  chapterConfidence?: "EXACT" | "PROBABLE" | "AMBIGUOUS" | "UNMAPPED";
  status: SourceMigrationStatus;
  isTemporary?: boolean;
  createdAt: number;
}

export interface ResolveFallbackOptions {
  savedTitle: {
    id?: string;
    title: string;
    author?: string;
    primarySourceId?: string;
    primaryMangaId?: string;
    sourceId?: string;
    mangaId?: string;
    linkedSources?: SourceRef[];
    lastReadChapterTitle?: string;
    lastReadChapterNumber?: number;
  };
  failedSourceId: string;
  health?: {
    status?: "HEALTHY" | "DEGRADED" | "BROKEN" | "RATE_LIMITED" | "UNKNOWN" | string;
    errorCode?: SourceErrorCode | string;
    message?: string;
  };
  targetChaptersMap?: Record<string, ChapterMeta[]>;
  availableSources?: Array<{ id: string; name?: string; isEnabled?: boolean; status?: string }>;
  alternateCandidates?: TitleCandidate[];
}

export interface SourceFallbackResult {
  status: SourceFallbackStatus;
  isTemporary?: boolean;
  candidate?: SourceRef & {
    title?: string;
    coverUrl?: string;
    author?: string;
    language?: string;
    sourceName?: string;
  };
  titleConfidence?: MatchConfidence;
  chapterMapping?: ChapterMapResult;
  suggestedChapterId?: string;
  suggestedChapterNumber?: number;
  nearestSafeChapter?: { chapterId: string; chapterNumber: number };
  reason: string;
  requiresUserConfirmation: boolean;
  notification?: {
    title: string;
    description: string;
    actionLabel?: string;
  };
}

/**
 * Deterministic source failure error codes that justify permanent fallback.
 */
const DETERMINISTIC_FAILURES: Array<SourceErrorCode | string> = [
  "ROUTE_CHANGED",
  "PARSER_BROKEN",
  "SCHEMA_CHANGED",
  "DECRYPT_FAILURE",
  "SOURCE_BROKEN",
];

/**
 * Authoritative Fallback Resolver.
 * Decides whether a failed source can be automatically or conditionally recovered.
 */
export function resolveSourceFallback(options: ResolveFallbackOptions): SourceFallbackResult {
  const {
    savedTitle,
    failedSourceId,
    health,
    targetChaptersMap = {},
    availableSources = [],
    alternateCandidates = [],
  } = options;

  const currentPrimarySourceId = savedTitle.primarySourceId ?? savedTitle.sourceId ?? failedSourceId;
  const healthStatus = health?.status ?? "BROKEN";
  const errorCode = health?.errorCode;

  if (healthStatus === "HEALTHY") {
    return {
      status: "NO_FALLBACK",
      reason: "Primary source is healthy",
      requiresUserConfirmation: false,
    };
  }

  if (healthStatus === "UNKNOWN") {
    return {
      status: "NO_FALLBACK",
      reason: "Source health status unknown; skipping speculative migration",
      requiresUserConfirmation: false,
    };
  }

  const isRateLimited = healthStatus === "RATE_LIMITED";
  const isDegraded = healthStatus === "DEGRADED";
  const isBrokenOrDeterministic =
    healthStatus === "BROKEN" ||
    (errorCode && DETERMINISTIC_FAILURES.includes(errorCode));

  // Helper to check if a target source is available
  const isSourceAvailable = (srcId: string): boolean => {
    if (srcId === failedSourceId) return false;
    if (availableSources.length === 0) return true;
    const meta = availableSources.find((s) => s.id === srcId);
    if (!meta) return true;
    return meta.isEnabled !== false && meta.status !== "unavailable" && meta.status !== "broken";
  };

  const linked = (savedTitle.linkedSources ?? []).filter(
    (ref) => ref.sourceId !== failedSourceId && isSourceAvailable(ref.sourceId)
  );

  let selectedCandidate: (SourceRef & { title?: string; coverUrl?: string; author?: string; language?: string }) | null = null;
  let titleConfidence: MatchConfidence = "NO_MATCH";

  // Sort linked sources by confidence priority: CONFIRMED > HIGH_CONFIDENCE > AMBIGUOUS
  const sortedLinked = [...linked].sort((a, b) => {
    const score = (c: MatchConfidence) =>
      c === "CONFIRMED" ? 3 : c === "HIGH_CONFIDENCE" ? 2 : c === "AMBIGUOUS" ? 1 : 0;
    return score(b.matchConfidence) - score(a.matchConfidence);
  });

  if (sortedLinked.length > 0 && sortedLinked[0].matchConfidence !== "NO_MATCH") {
    const top = sortedLinked[0];
    selectedCandidate = {
      ...top,
      language: top.sourceId === "mangadex" ? "id" : undefined,
    };
    titleConfidence = top.matchConfidence;
  }

  // Priority 2: Discovered alternates if no usable linked source
  if (!selectedCandidate && alternateCandidates.length > 0) {
    const filteredAlternates = alternateCandidates.filter(
      (c) => c.sourceId !== failedSourceId && isSourceAvailable(c.sourceId)
    );

    const ranked = rankCandidates(savedTitle.title, filteredAlternates, savedTitle.author);
    if (ranked.length > 0 && ranked[0].result.confidence !== "NO_MATCH") {
      const best = ranked[0];
      selectedCandidate = {
        sourceId: best.candidate.sourceId,
        mangaId: best.candidate.mangaId,
        title: best.candidate.title,
        coverUrl: best.candidate.coverUrl,
        author: best.candidate.author,
        addedAt: Date.now(),
        // Heuristic matches must NEVER be promoted to CONFIRMED
        matchConfidence: best.result.confidence === "CONFIRMED" ? "HIGH_CONFIDENCE" : best.result.confidence,
        language: best.candidate.sourceId === "mangadex" ? "id" : undefined,
      };
      titleConfidence = selectedCandidate.matchConfidence;
    }
  }

  if (!selectedCandidate) {
    return {
      status: "NO_FALLBACK",
      reason: "No matching alternate source candidate found",
      requiresUserConfirmation: false,
    };
  }

  // If match confidence is AMBIGUOUS, never auto-switch!
  const isTitleAmbiguous = titleConfidence === "AMBIGUOUS";

  const targetChapters = targetChaptersMap[selectedCandidate.sourceId];
  const lastRead =
    savedTitle.lastReadChapterNumber ??
    savedTitle.lastReadChapterTitle;

  let chapterMapping: ChapterMapResult | undefined;
  let suggestedChapterId: string | undefined;
  let suggestedChapterNumber: number | undefined;
  let nearestSafeChapter: { chapterId: string; chapterNumber: number } | undefined;

  if (targetChapters && targetChapters.length > 0) {
    if (lastRead != null) {
      chapterMapping = mapChapterProgress(lastRead, targetChapters);

      if (chapterMapping.type === "EXACT") {
        suggestedChapterId = chapterMapping.targetChapterId;
        suggestedChapterNumber = chapterMapping.chapterNumber;
      } else {
        // Nearest lower safe candidate (guaranteed <= lastRead)
        if (chapterMapping.nearestSafeCandidate) {
          nearestSafeChapter = chapterMapping.nearestSafeCandidate;
          suggestedChapterId = nearestSafeChapter.chapterId;
          suggestedChapterNumber = nearestSafeChapter.chapterNumber;
        }
      }
    } else {
      // No previous reading progress: starting fresh
      const firstChapter = targetChapters[0];
      if (firstChapter) {
        suggestedChapterId = firstChapter.chapterId;
        suggestedChapterNumber = firstChapter.chapterNumber ?? 1;
      }
    }
  }

  // Condition for AUTO_SAFE:
  // - Title confidence must be CONFIRMED or HIGH_CONFIDENCE (never AMBIGUOUS or NO_MATCH)
  // - Health must be BROKEN / deterministic failure OR RATE_LIMITED (for temporary fallback)
  // - If user has prior progress, chapterMapping must be EXACT
  // - Source must not be merely DEGRADED
  const isChapterExact = chapterMapping ? chapterMapping.type === "EXACT" : (lastRead == null);
  const isHighConfidenceTitle = titleConfidence === "CONFIRMED" || titleConfidence === "HIGH_CONFIDENCE";

  if (isDegraded) {
    return {
      status: "CONFIRM_REQUIRED",
      candidate: selectedCandidate,
      titleConfidence,
      chapterMapping,
      suggestedChapterId,
      suggestedChapterNumber,
      nearestSafeChapter,
      reason: "Source is degraded; prefer current source unless user explicitly requests alternate",
      requiresUserConfirmation: true,
      notification: {
        title: "Koneksi Sumber Lambat",
        description: `Sumber ${failedSourceId} sedang mengalami kendala. Alternatif tersedia di ${selectedCandidate.sourceId}.`,
        actionLabel: "Ganti Sumber",
      },
    };
  }

  if (isRateLimited) {
    const canAutoFallback = isHighConfidenceTitle && isChapterExact;
    return {
      status: canAutoFallback ? "AUTO_SAFE" : "CONFIRM_REQUIRED",
      isTemporary: true,
      candidate: selectedCandidate,
      titleConfidence,
      chapterMapping,
      suggestedChapterId,
      suggestedChapterNumber,
      nearestSafeChapter,
      reason: "Source is temporarily rate-limited; temporary fallback allowed for current reading session",
      requiresUserConfirmation: !canAutoFallback,
      notification: {
        title: "Batas Akses Tercapai (Sementara)",
        description: `Beralih sementara ke ${selectedCandidate.sourceId}. Sumber utama tidak diubah.`,
      },
    };
  }

  if (isBrokenOrDeterministic) {
    if (isHighConfidenceTitle && isChapterExact) {
      return {
        status: "AUTO_SAFE",
        isTemporary: false,
        candidate: selectedCandidate,
        titleConfidence,
        chapterMapping,
        suggestedChapterId,
        suggestedChapterNumber,
        reason: `Safe automatic fallback: ${titleConfidence} title match with exact chapter mapping`,
        requiresUserConfirmation: false,
        notification: {
          title: "Sumber bacaan diganti",
          description: `${failedSourceId} sedang tidak tersedia. Yomirra beralih ke ${selectedCandidate.sourceId}. Progress Chapter ${suggestedChapterNumber ?? ""} tetap disimpan.`,
        },
      };
    }

    // Title is ambiguous OR chapter mapping is not exact -> require user confirmation
    const reason = isTitleAmbiguous
      ? "Ambiguous title match: requires user confirmation before switching source"
      : "Non-exact chapter mapping: requires user confirmation to avoid skipping progress";

    return {
      status: "CONFIRM_REQUIRED",
      isTemporary: false,
      candidate: selectedCandidate,
      titleConfidence,
      chapterMapping,
      suggestedChapterId,
      suggestedChapterNumber,
      nearestSafeChapter,
      reason,
      requiresUserConfirmation: true,
      notification: {
        title: "Sumber alternatif ditemukan",
        description: `Progress kamu: Chapter ${lastRead ?? "?"}. Sumber baru memiliki chapter yang perlu dikonfirmasi.`,
        actionLabel: "Pilih Chapter",
      },
    };
  }

  return {
    status: "CONFIRM_REQUIRED",
    candidate: selectedCandidate,
    titleConfidence,
    chapterMapping,
    reason: "Fallback candidate requires confirmation",
    requiresUserConfirmation: true,
  };
}

/**
 * Executes source migration safely, creating a reversible snapshot.
 *
 * Invariants:
 * 1. User library item is NEVER deleted.
 * 2. Old reading history is NEVER deleted.
 * 3. Old source reference is preserved in linkedSources as CONFIRMED.
 * 4. Page index is reset to 0 in target source (never blindly copied).
 * 5. If isTemporary is true, primarySourceId is NOT mutated in library store.
 */
export function executeSourceMigration(params: {
  libraryItem: LibraryItem;
  fallbackResult: SourceFallbackResult;
  historyItem?: HistoryItem;
  isPermanent?: boolean;
  relinkTitleFn?: (
    savedTitleIdOrKey: string,
    newSourceId: string,
    newMangaId: string,
    extra?: { title?: string; coverUrl?: string; author?: string }
  ) => void;
  saveProgressFn?: (
    sourceId: string,
    mangaId: string,
    chapterId: string,
    pageIndex: number,
    pageOffset?: number
  ) => void;
}): SourceMigrationSnapshot {
  const {
    libraryItem,
    fallbackResult,
    historyItem,
    isPermanent = true,
    relinkTitleFn,
    saveProgressFn,
  } = params;

  const candidate = fallbackResult.candidate;
  if (!candidate) {
    throw new Error("Cannot execute source migration without a valid candidate");
  }

  const savedTitleId = libraryItem.id ?? `${libraryItem.sourceId}::${libraryItem.mangaId}`;
  const fromSourceId = libraryItem.primarySourceId ?? libraryItem.sourceId;
  const fromMangaId = libraryItem.primaryMangaId ?? libraryItem.mangaId;
  const fromChapterId = historyItem?.chapterId ?? libraryItem.lastReadChapterId;
  const fromChapterTitle = historyItem?.chapterTitle ?? libraryItem.lastReadChapterTitle;
  const fromChapterNumber = historyItem?.chapterNumber;
  const fromPageIndex = historyItem?.pageIndex ?? 0;

  const toSourceId = candidate.sourceId;
  const toMangaId = candidate.mangaId;
  const toChapterId = fallbackResult.suggestedChapterId;
  const toChapterNumber = fallbackResult.suggestedChapterNumber;

  const isTemporary = fallbackResult.isTemporary || !isPermanent;

  const snapshot: SourceMigrationSnapshot = {
    id: `mig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedTitleId,
    fromSourceId,
    fromMangaId,
    fromChapterId,
    fromChapterTitle,
    fromChapterNumber,
    fromPageIndex,
    toSourceId,
    toMangaId,
    toChapterId,
    toChapterTitle: toChapterNumber != null ? `Chapter ${toChapterNumber}` : undefined,
    toChapterNumber,
    titleConfidence: fallbackResult.titleConfidence ?? "HIGH_CONFIDENCE",
    chapterConfidence: fallbackResult.chapterMapping?.type,
    status: isTemporary ? "AUTO_APPLIED" : "CONFIRMED",
    isTemporary,
    createdAt: Date.now(),
  };

  // Record migration snapshot in persistent in-memory / session registry
  migrationSnapshotRegistry.set(snapshot.id, snapshot);

  if (!isTemporary && relinkTitleFn) {
    relinkTitleFn(savedTitleId, toSourceId, toMangaId, {
      title: candidate.title,
      coverUrl: candidate.coverUrl,
      author: candidate.author,
    });
  }

  if (toChapterId && saveProgressFn) {
    saveProgressFn(toSourceId, toMangaId, toChapterId, 0, 0);
  }

  return snapshot;
}

/**
 * Rolls back a previous source migration using its snapshot.
 * Restores primary source and original reading progress.
 */
export function rollbackSourceMigration(params: {
  snapshot: SourceMigrationSnapshot;
  relinkTitleFn?: (
    savedTitleIdOrKey: string,
    newSourceId: string,
    newMangaId: string,
    extra?: { title?: string; coverUrl?: string; author?: string }
  ) => void;
  saveProgressFn?: (
    sourceId: string,
    mangaId: string,
    chapterId: string,
    pageIndex: number,
    pageOffset?: number
  ) => void;
}): SourceMigrationSnapshot {
  const { snapshot, relinkTitleFn, saveProgressFn } = params;

  if (!snapshot.isTemporary && relinkTitleFn) {
    relinkTitleFn(snapshot.savedTitleId, snapshot.fromSourceId, snapshot.fromMangaId);
  }

  if (snapshot.fromChapterId && saveProgressFn) {
    saveProgressFn(
      snapshot.fromSourceId,
      snapshot.fromMangaId,
      snapshot.fromChapterId,
      snapshot.fromPageIndex ?? 0,
      0
    );
  }

  const updated: SourceMigrationSnapshot = {
    ...snapshot,
    status: "ROLLED_BACK",
  };
  migrationSnapshotRegistry.set(snapshot.id, updated);
  return updated;
}

/**
 * In-memory registry for reversible migration snapshots.
 */
export const migrationSnapshotRegistry = new Map<string, SourceMigrationSnapshot>();
