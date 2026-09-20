import { SourceRef } from "@/shared/store/library-store";
import {
  resolveSourceFallback,
  type SourceFallbackResult,
  type ResolveFallbackOptions,
} from "./source-fallback";
import { type SourceRoutingMode } from "@/shared/store/settings-store";
import { getSourceMetadata, getAllSourceMetadata } from "@/shared/sources/source-registry";
import type { ChapterMeta } from "./chapter-parser";
import type { TitleCandidate } from "./title-matcher";

export interface SourceHealthRouteSnapshot {
  status?: "HEALTHY" | "DEGRADED" | "BROKEN" | "RATE_LIMITED" | "DOMAIN_CHANGED" | "UNKNOWN" | string;
  latencyMs?: number;
  errorCode?: string;
  message?: string;
  resolvedHost?: string;
}

export interface ResolveSourceRouteOptions {
  savedTitle?: {
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
  requestedSourceId?: string;
  requestedMangaId?: string;
  routingMode?: SourceRoutingMode;
  globalSourceOrder?: string[];
  languagePreference?: string[];
  perTitleSourcePreference?: string;
  healthMap?: Record<string, SourceHealthRouteSnapshot>;
  targetChaptersMap?: Record<string, ChapterMeta[]>;
  availableSources?: Array<{ id: string; name?: string; isEnabled?: boolean; status?: string; language?: string }>;
  alternateCandidates?: TitleCandidate[];
}

export type RoutingRuleApplied =
  | "EXPLICIT_PER_TITLE"
  | "CONFIRMED_LINKED"
  | "GLOBAL_ORDER"
  | "LANGUAGE_PREFERENCE"
  | "HEALTH_SAFE"
  | "FALLBACK_AUTO_SAFE"
  | "FALLBACK_MANUAL_HOLD"
  | "FALLBACK_SUGGESTION"
  | "DEFAULT_PRIMARY";

export interface SourceRouteResult {
  selectedSourceId: string;
  selectedMangaId?: string;
  reason: string;
  ruleApplied: RoutingRuleApplied;
  isTemporary: boolean;
  requiresUserConfirmation: boolean;
  fallbackResult?: SourceFallbackResult;
  suggestedChapterId?: string;
  suggestedChapterNumber?: number;
  domainResolutionRequired?: boolean;
  resolvedHost?: string;
}

/**
 * Authoritative Smart Source Routing Resolver (Phase 6).
 *
 * Enforces strict precedence:
 * 1. Explicit per-title user choice.
 * 2. Previously CONFIRMED source binding.
 * 3. Global source preference / order.
 * 4. Language preference.
 * 5. Source health.
 * 6. Phase 5 fallback migration.
 *
 * Invariants:
 * - Explicit user choice outranks latency and opportunistic heuristics (D-P6-01).
 * - MANUAL mode never silently changes source.
 * - PREFERRED mode allows temporary fallback on rate limits without permanent relinking.
 * - AUTO_SAFE mode delegates to Phase 5 for permanent migration on confirmed broken sources.
 * - DOMAIN_CHANGED resolves domain before attempting source switch.
 * - UNKNOWN health does not trigger permanent migration.
 */
export function resolveSourceRoute(options: ResolveSourceRouteOptions): SourceRouteResult {
  const {
    savedTitle,
    requestedSourceId,
    requestedMangaId,
    routingMode = "PREFERRED",
    globalSourceOrder = [],
    languagePreference = ["id", "en"],
    perTitleSourcePreference,
    healthMap = {},
    targetChaptersMap = {},
    availableSources = getAllSourceMetadata(),
    alternateCandidates = [],
  } = options;

  // Determine initial preferred source
  const effectivePreferredSourceId =
    perTitleSourcePreference ||
    requestedSourceId ||
    savedTitle?.primarySourceId ||
    savedTitle?.sourceId;

  const defaultMangaId =
    requestedMangaId ||
    savedTitle?.primaryMangaId ||
    savedTitle?.mangaId;

  // Helper to get health snapshot
  const getHealth = (srcId: string): SourceHealthRouteSnapshot => {
    return healthMap[srcId] || { status: "HEALTHY", latencyMs: 0 };
  };

  // Helper to find matching mangaId for a given source in linkedSources
  const findLinkedMangaId = (srcId: string): string | undefined => {
    if (srcId === savedTitle?.primarySourceId || srcId === savedTitle?.sourceId) {
      return defaultMangaId;
    }
    const match = (savedTitle?.linkedSources || []).find((l) => l.sourceId === srcId);
    return match?.mangaId;
  };

  if (!effectivePreferredSourceId) {
    const fallbackSourceId = globalSourceOrder[0] || availableSources[0]?.id || "mangadex";
    return {
      selectedSourceId: fallbackSourceId,
      selectedMangaId: defaultMangaId,
      reason: "No source specified; defaulted to top global preference",
      ruleApplied: "GLOBAL_ORDER",
      isTemporary: false,
      requiresUserConfirmation: false,
    };
  }

  const preferredHealth = getHealth(effectivePreferredSourceId);
  const preferredHealthStatus = preferredHealth.status || "HEALTHY";
  const isExplicitUserChoice = !!(perTitleSourcePreference || requestedSourceId);

  if (preferredHealthStatus === "DOMAIN_CHANGED") {
    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: "Source domain changed; resolving new upstream domain before switching",
      ruleApplied: isExplicitUserChoice ? "EXPLICIT_PER_TITLE" : "DEFAULT_PRIMARY",
      isTemporary: false,
      requiresUserConfirmation: false,
      domainResolutionRequired: true,
      resolvedHost: preferredHealth.resolvedHost,
    };
  }

  // In all modes, if the preferred source is HEALTHY, it is selected immediately.
  // Latency is NEVER used to bypass a healthy preferred source.
  if (preferredHealthStatus === "HEALTHY" || preferredHealthStatus === "UNKNOWN") {
    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: isExplicitUserChoice
        ? "Explicit user source preference selected (healthy)"
        : "Primary source is healthy",
      ruleApplied: isExplicitUserChoice ? "EXPLICIT_PER_TITLE" : "DEFAULT_PRIMARY",
      isTemporary: false,
      requiresUserConfirmation: false,
    };
  }

  // If DEGRADED, keep preferred source unless request explicitly fails at runtime
  if (preferredHealthStatus === "DEGRADED") {
    // If routingMode is PREFERRED and title is saved, we can optionally note degraded status
    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: "Source is degraded but reachable; keeping preferred source",
      ruleApplied: isExplicitUserChoice ? "EXPLICIT_PER_TITLE" : "DEFAULT_PRIMARY",
      isTemporary: false,
      requiresUserConfirmation: false,
    };
  }

  const isRateLimited = preferredHealthStatus === "RATE_LIMITED";
  const isBroken = preferredHealthStatus === "BROKEN" || !!preferredHealth.errorCode;

  // MODE A: MANUAL
  // Never auto-switch sources in MANUAL mode under any circumstances.
  if (routingMode === "MANUAL") {
    let fallbackSuggestion: SourceFallbackResult | undefined;
    if (savedTitle) {
      fallbackSuggestion = resolveSourceFallback({
        savedTitle,
        failedSourceId: effectivePreferredSourceId,
        health: preferredHealth,
        targetChaptersMap,
        availableSources,
        alternateCandidates,
      });
    }

    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: `MANUAL mode: preferred source is ${preferredHealthStatus}; holding source without automatic switch`,
      ruleApplied: "FALLBACK_MANUAL_HOLD",
      isTemporary: false,
      requiresUserConfirmation: true,
      fallbackResult: fallbackSuggestion,
      suggestedChapterId: fallbackSuggestion?.suggestedChapterId,
      suggestedChapterNumber: fallbackSuggestion?.suggestedChapterNumber,
    };
  }

  // MODE B: PREFERRED
  // Try user-preferred source first. If RATE_LIMITED, allow temporary fallback to linked alternative.
  // If BROKEN, evaluate temporary or confirmed fallback without permanently relinking automatically.
  if (routingMode === "PREFERRED") {
    if (savedTitle) {
      const fallbackResult = resolveSourceFallback({
        savedTitle,
        failedSourceId: effectivePreferredSourceId,
        health: preferredHealth,
        targetChaptersMap,
        availableSources,
        alternateCandidates,
      });

      if (fallbackResult.status === "AUTO_SAFE" && fallbackResult.candidate) {
        return {
          selectedSourceId: fallbackResult.candidate.sourceId,
          selectedMangaId: fallbackResult.candidate.mangaId,
          reason: isRateLimited
            ? "Temporary fallback: preferred source rate-limited; reading from linked alternative"
            : "Temporary fallback: preferred source broken; using safe alternative without relinking",
          ruleApplied: "FALLBACK_AUTO_SAFE",
          isTemporary: true, // PREFERRED mode never permanently relinks automatically
          requiresUserConfirmation: false,
          fallbackResult,
          suggestedChapterId: fallbackResult.suggestedChapterId,
          suggestedChapterNumber: fallbackResult.suggestedChapterNumber,
        };
      }

      if (fallbackResult.status === "CONFIRM_REQUIRED") {
        return {
          selectedSourceId: effectivePreferredSourceId,
          selectedMangaId: defaultMangaId,
          reason: `Preferred source is ${preferredHealthStatus}; alternate candidate requires confirmation`,
          ruleApplied: "FALLBACK_SUGGESTION",
          isTemporary: true,
          requiresUserConfirmation: true,
          fallbackResult,
          suggestedChapterId: fallbackResult.suggestedChapterId,
          suggestedChapterNumber: fallbackResult.suggestedChapterNumber,
        };
      }
    }

    // No fallback candidate found
    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: `Preferred source is ${preferredHealthStatus}; no safe alternate found`,
      ruleApplied: isExplicitUserChoice ? "EXPLICIT_PER_TITLE" : "DEFAULT_PRIMARY",
      isTemporary: false,
      requiresUserConfirmation: true,
    };
  }

  // MODE C: AUTO_SAFE
  // Safe automated migration when preferred source is confirmed broken.
  if (routingMode === "AUTO_SAFE") {
    if (savedTitle) {
      const fallbackResult = resolveSourceFallback({
        savedTitle,
        failedSourceId: effectivePreferredSourceId,
        health: preferredHealth,
        targetChaptersMap,
        availableSources,
        alternateCandidates,
      });

      if (fallbackResult.status === "AUTO_SAFE" && fallbackResult.candidate) {
        return {
          selectedSourceId: fallbackResult.candidate.sourceId,
          selectedMangaId: fallbackResult.candidate.mangaId,
          reason: isRateLimited
            ? "AUTO_SAFE temporary routing: source rate-limited"
            : "AUTO_SAFE permanent migration: verified safe match and exact chapter mapping",
          ruleApplied: "FALLBACK_AUTO_SAFE",
          isTemporary: isRateLimited, // Permanent for broken, temporary for rate-limited
          requiresUserConfirmation: false,
          fallbackResult,
          suggestedChapterId: fallbackResult.suggestedChapterId,
          suggestedChapterNumber: fallbackResult.suggestedChapterNumber,
        };
      }

      return {
        selectedSourceId: effectivePreferredSourceId,
        selectedMangaId: defaultMangaId,
        reason: fallbackResult.reason || `Source ${preferredHealthStatus}; requires user confirmation`,
        ruleApplied: "FALLBACK_SUGGESTION",
        isTemporary: false,
        requiresUserConfirmation: true,
        fallbackResult,
        suggestedChapterId: fallbackResult.suggestedChapterId,
        suggestedChapterNumber: fallbackResult.suggestedChapterNumber,
      };
    }

    return {
      selectedSourceId: effectivePreferredSourceId,
      selectedMangaId: defaultMangaId,
      reason: `Source is ${preferredHealthStatus}; title not in library`,
      ruleApplied: "DEFAULT_PRIMARY",
      isTemporary: false,
      requiresUserConfirmation: true,
    };
  }

  return {
    selectedSourceId: effectivePreferredSourceId,
    selectedMangaId: defaultMangaId,
    reason: "Default source route applied",
    ruleApplied: "DEFAULT_PRIMARY",
    isTemporary: false,
    requiresUserConfirmation: false,
  };
}

/**
 * Score and rank candidate sources using the Phase 6 policy:
 * 1. Language preference
 * 2. Global source order
 * 3. Health status
 * 4. Latency (tie-breaker only)
 */
export function rankSourcesByPreference(params: {
  candidateSourceIds: string[];
  globalSourceOrder?: string[];
  languagePreference?: string[];
  healthMap?: Record<string, SourceHealthRouteSnapshot>;
}): string[] {
  const {
    candidateSourceIds,
    globalSourceOrder = [],
    languagePreference = ["id", "en"],
    healthMap = {},
  } = params;

  return [...candidateSourceIds].sort((a, b) => {
    const metaA = getSourceMetadata(a);
    const metaB = getSourceMetadata(b);

    const langA = metaA?.language || "id";
    const langB = metaB?.language || "id";

    const langScoreA = languagePreference.indexOf(langA) !== -1 ? 100 - languagePreference.indexOf(langA) * 20 : 0;
    const langScoreB = languagePreference.indexOf(langB) !== -1 ? 100 - languagePreference.indexOf(langB) * 20 : 0;

    if (langScoreA !== langScoreB) {
      return langScoreB - langScoreA;
    }

    const orderIndexA = globalSourceOrder.indexOf(a);
    const orderIndexB = globalSourceOrder.indexOf(b);
    const orderScoreA = orderIndexA !== -1 ? 50 - orderIndexA : 0;
    const orderScoreB = orderIndexB !== -1 ? 50 - orderIndexB : 0;

    if (orderScoreA !== orderScoreB) {
      return orderScoreB - orderScoreA;
    }

    const healthA = healthMap[a]?.status || "HEALTHY";
    const healthB = healthMap[b]?.status || "HEALTHY";

    const healthWeight = (s: string) => {
      switch (s) {
        case "HEALTHY":
          return 40;
        case "DEGRADED":
          return 20;
        case "UNKNOWN":
          return 10;
        case "RATE_LIMITED":
          return 5;
        case "DOMAIN_CHANGED":
          return 2;
        case "BROKEN":
        default:
          return 0;
      }
    };

    const healthDiff = healthWeight(healthB) - healthWeight(healthA);
    if (healthDiff !== 0) {
      return healthDiff;
    }

    const latA = healthMap[a]?.latencyMs ?? 100;
    const latB = healthMap[b]?.latencyMs ?? 100;
    return latA - latB;
  });
}
