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
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
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
  const checkDeadline = () => options.signal?.throwIfAborted();

  try {
    checkDeadline();
    resolvedHost = await domainResolver.resolveDomain(normalizedId, "api");
    checkDeadline();
    if (!resolvedHost) {
      resolvedHost = await domainResolver.resolveDomain(normalizedId, "frontend");
      checkDeadline();
    }

    const adapter = await sourceManager.getSource(normalizedId, null, { allowDisabled: true });
    checkDeadline();
    if (!adapter) {
      throw new SourceError(`Source adapter '${normalizedId}' not registered`, {
        code: "SOURCE_DOWN",
        sourceId: normalizedId,
        stage: "transport",
      });
    }

    stage = "search";
    const popularResult = !options.deep && adapter.getHealthSample
      ? await adapter.getHealthSample()
      : await adapter.getPopular(1);
    checkDeadline();

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

    const sampleManga = popularResult.mangas.find(manga => typeof manga.id === "string" && manga.id.trim() && typeof manga.title === "string" && manga.title.trim());
    if (!sampleManga) throw new SourceError("Listing contains no valid title identity", { code: "SCHEMA_CHANGED", sourceId: normalizedId, stage });
    let sampleChapterId: string | undefined;
    let pagesSkipped: "locked" | "no-chapters" | "access-unknown" | undefined;

    if (options.deep) {
      // Stage: DETAIL
      stage = "detail";
      const detail = await adapter.getDetail(sampleManga.id);
      checkDeadline();
      if (!detail || detail.id !== sampleManga.id || typeof detail.title !== "string" || !detail.title.trim()) {
        throw new SourceError(`Detail verification failed for manga '${sampleManga.id}'`, {
          code: "SCHEMA_CHANGED",
          sourceId: normalizedId,
          stage: "detail",
        });
      }

      // Stage: CHAPTERS
      stage = "chapters";
      const chapters = await adapter.getChapters(sampleManga.id);
      checkDeadline();
      if (!Array.isArray(chapters)) {
        throw new SourceError("Invalid chapter listing schema", { code: "SCHEMA_CHANGED", sourceId: normalizedId, stage });
      }

      // A new series or locked chapter is not an adapter outage. Do not
      // attempt to resolve pages behind an access boundary.
      const targetChapter = chapters.find(c => c && c.isLocked === false && c.mangaId === sampleManga.id && typeof c.id === "string" && c.id.trim());
      if (!targetChapter) {
        if (chapters.some(c => c && c.isLocked === false && (c.mangaId !== sampleManga.id || typeof c.id !== "string" || !c.id.trim()))) {
          throw new SourceError("Invalid unlocked chapter identity", { code: "SCHEMA_CHANGED", sourceId: normalizedId, stage });
        }
        pagesSkipped = !chapters.length ? "no-chapters" : chapters.every(c => c?.isLocked === true) ? "locked" : "access-unknown";
      } else {
        stage = "pages";
        sampleChapterId = targetChapter.id;
        const pagesResult = await adapter.getPages(targetChapter.id, { mangaId: sampleManga.id });
        checkDeadline();
        if (!pagesResult || pagesResult.chapterId !== targetChapter.id || !Array.isArray(pagesResult.pages) || pagesResult.pages.length === 0) {
          throw new SourceError("Unlocked chapter returned no page references", { code: "PARSER_BROKEN", sourceId: normalizedId, stage });
        }
      }
    }

    checkDeadline();
    const latencyMs = Date.now() - startTime;
    const status: SourceHealthStatus = latencyMs > 4000 ? "DEGRADED" : "HEALTHY";

    // Record verified working domain
    if (resolvedHost) {
      await domainResolver.recordWorkingDomain(normalizedId, resolvedHost, "api");
      checkDeadline();
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
        ...(pagesSkipped ? { pagesSkipped } : {}),
        probeType: options.deep ? "deep" : "lightweight",
      },
    };

    await sourceHealthStore.recordSnapshot(snapshot);
    return snapshot;
  } catch (err: unknown) {
    checkDeadline(); // Do not persist an observation abandoned by its caller.
    const latencyMs = Date.now() - startTime;
    const classified = SourceError.classify(err, normalizedId, stage);

    // A single failed monitor request does not prove the reader is down.
    const previous = await sourceHealthStore.getSnapshot(normalizedId);
    checkDeadline();
    const neutral = ["RATE_LIMITED", "CONTENT_NOT_FOUND", "CHAPTER_UNAVAILABLE", "CONTENT_RESTRICTED", "MAPPING_UNAVAILABLE", "SOURCE_DISABLED"].includes(classified.code);
    const consecutiveFailures = neutral ? 0 : (previous?.consecutiveFailures ?? 0) + 1;
    let status: SourceHealthStatus = consecutiveFailures >= 3 ? "BROKEN" : "DEGRADED";
    if (classified.code === "RATE_LIMITED") {
      status = "RATE_LIMITED";
    } else if (neutral) {
      status = "UNKNOWN";
    } else if (classified.code === "DOMAIN_CHANGED" && consecutiveFailures >= 3) {
      status = "DOMAIN_CHANGED";
    }

    logger.warn(`Source health probe failed for ${normalizedId}`, {
      code: classified.code,
      stage,
      latencyMs,
      error: classified.message,
    });

    // Never rewrite routing from a failed monitoring request. A transient 502
    // or an API host error does not validate a new frontend mirror.
    const snapshot: SourceHealthSnapshot = {
      sourceId: normalizedId,
      status,
      stage,
      latencyMs,
      resolvedHost,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: null,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures,
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

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  const pool = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(pool);
  return results;
}

/**
 * Probes all active enabled sources with bounded concurrency and individual timeouts.
 */
export async function probeAllSourcesHealth(
  options: HealthProbeOptions = {}
): Promise<Record<string, SourceHealthSnapshot>> {
  const runtimeSources = await getRuntimeSources().catch(() => getAllSourceMetadata());
  const activeSources = runtimeSources.filter((s) => s.isEnabled && s.isInstalled && !s.maintenance && s.status !== "in-dev" && s.status !== "in-fix");
  const results: Record<string, SourceHealthSnapshot> = {};
  await mapConcurrent(activeSources, 3, async (meta) => {
    // Shinigami's adapter timeout is 15 seconds; do not cut its probe at 10s.
    const timeoutMs = options.timeoutMs ?? (meta.id === "shinigami" ? 18000 : 10000);
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      const probePromise = probeSourceHealth(meta.id, { ...options, signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => {
            const error = new Error(`Health probe timeout after ${timeoutMs}ms`);
            controller.abort(error);
            reject(error);
          },
          timeoutMs
        );
      });
      const snapshot = await Promise.race([probePromise, timeoutPromise]);
      results[meta.id] = snapshot;
    } catch (error) {
      logger.error(`Unhandled error during health probe for ${meta.id}`, { error });
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }
  });

  return results;
}
