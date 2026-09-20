import { sourceManager } from "@/server/lib/sources/source-manager";
import { domainResolver } from "../domain-resolver";
import { SourceError, type SourceHealthStage } from "../error";
import { sourceHealthStore } from "./health-store";
import type {
  HealthProbeOptions,
  SourceHealthSnapshot,
  SourceHealthStatus,
} from "./types";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { logger } from "@/shared/logger";

/**
 * Functional health probe runner.
 * Evaluates operational capability across layers (transport, search/listing, detail, chapters, pages)
 * rather than relying purely on homepage HTTP 200 reachability.
 */
export async function probeSourceHealth(
  sourceId: string,
  options: HealthProbeOptions = {}
): Promise<SourceHealthSnapshot> {
  const normalizedId = sourceId.toLowerCase().trim();
  const startTime = Date.now();
  let stage: SourceHealthStage = "transport";
  let resolvedHost = "";

  try {
    resolvedHost = await domainResolver.resolveDomain(normalizedId, "api");
    if (!resolvedHost) {
      resolvedHost = await domainResolver.resolveDomain(normalizedId, "frontend");
    }

    const adapter = await sourceManager.getSource(normalizedId);
    if (!adapter) {
      throw new SourceError(`Source adapter '${normalizedId}' not registered`, {
        code: "SOURCE_DOWN",
        sourceId: normalizedId,
        stage: "transport",
      });
    }

    stage = "search";
    const popularResult = await adapter.getPopular(1);

    // Schema / Parser validation: popular page 1 MUST return at least 1 item
    if (!popularResult || !Array.isArray(popularResult.mangas) || popularResult.mangas.length === 0) {
      throw new SourceError(
        `Adapter returned zero manga items on popular listing. Possible DOM structure or schema change.`,
        {
          code: "PARSER_BROKEN",
          sourceId: normalizedId,
          stage: "search",
        }
      );
    }

    const sampleManga = popularResult.mangas[0];
    let sampleChapterId: string | undefined;

    if (options.deep) {
      // Stage: DETAIL
      stage = "detail";
      const detail = await adapter.getDetail(sampleManga.id);
      if (!detail || !detail.title) {
        throw new SourceError(`Detail verification failed for manga '${sampleManga.id}'`, {
          code: "SCHEMA_CHANGED",
          sourceId: normalizedId,
          stage: "detail",
        });
      }

      // Stage: CHAPTERS
      stage = "chapters";
      const chapters = await adapter.getChapters(sampleManga.id);
      if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
        throw new SourceError(`Chapter listing returned 0 chapters for manga '${sampleManga.id}'`, {
          code: "SCHEMA_CHANGED",
          sourceId: normalizedId,
          stage: "chapters",
        });
      }

      // Stage: PAGES
      stage = "pages";
      // Pick first non-locked chapter if available
      const targetChapter = chapters.find((c) => !c.isLocked) || chapters[0];
      sampleChapterId = targetChapter.id;
      const pagesResult = await adapter.getPages(targetChapter.id);

      if (!pagesResult || !Array.isArray(pagesResult.pages) || pagesResult.pages.length === 0) {
        // If chapter is locked, absence of pages is expected boundary behavior
        if (!targetChapter.isLocked) {
          throw new SourceError(`Pages resolution returned 0 pages for chapter '${targetChapter.id}'`, {
            code: "PARSER_BROKEN",
            sourceId: normalizedId,
            stage: "pages",
          });
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    const status: SourceHealthStatus = latencyMs > 4000 ? "DEGRADED" : "HEALTHY";

    // Record verified working domain
    if (resolvedHost) {
      await domainResolver.recordWorkingDomain(normalizedId, resolvedHost, "api");
    }

    const snapshot: SourceHealthSnapshot = {
      sourceId: normalizedId,
      status,
      stage,
      latencyMs,
      resolvedHost,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: null,
      consecutiveFailures: 0,
      metadata: {
        totalParsed: popularResult.mangas.length,
        sampleMangaId: sampleManga.id,
        sampleChapterId,
        probeType: options.deep ? "deep" : "lightweight",
      },
    };

    await sourceHealthStore.recordSnapshot(snapshot);
    return snapshot;
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const classified = SourceError.classify(err, normalizedId, stage);

    let status: SourceHealthStatus = "BROKEN";
    if (classified.code === "RATE_LIMITED") {
      status = "RATE_LIMITED";
    } else if (classified.code === "DOMAIN_CHANGED") {
      status = "DOMAIN_CHANGED";
    }

    logger.warn(`Source health probe failed for ${normalizedId}`, {
      code: classified.code,
      stage,
      latencyMs,
      error: classified.message,
    });

    // If failure indicates transport or domain issue, try fallback mirror
    if (classified.code === "SOURCE_DOWN" || classified.code === "DOMAIN_CHANGED") {
      const fallbackMirror = await domainResolver.markDomainFailed(normalizedId, resolvedHost, "frontend");
      if (fallbackMirror) {
        logger.info(`Recorded fallback mirror ${fallbackMirror} for ${normalizedId}`);
      }
    }

    const snapshot: SourceHealthSnapshot = {
      sourceId: normalizedId,
      status,
      stage,
      latencyMs,
      resolvedHost,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: null,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures: 1, // Will be computed accurately by store
      lastFailureCode: classified.code,
      errorMessage: classified.message,
      metadata: {
        probeType: options.deep ? "deep" : "lightweight",
      },
    };

    await sourceHealthStore.recordSnapshot(snapshot);
    return snapshot;
  }
}

/**
 * Probes all active enabled sources.
 */
export async function probeAllSourcesHealth(
  options: HealthProbeOptions = {}
): Promise<Record<string, SourceHealthSnapshot>> {
  const activeSources = getAllSourceMetadata().filter((s) => s.isEnabled && s.isInstalled);
  const results: Record<string, SourceHealthSnapshot> = {};

  await Promise.all(
    activeSources.map(async (meta) => {
      try {
        const snapshot = await probeSourceHealth(meta.id, options);
        results[meta.id] = snapshot;
      } catch (error) {
        logger.error(`Unhandled error during health probe for ${meta.id}`, { error });
      }
    })
  );

  return results;
}
