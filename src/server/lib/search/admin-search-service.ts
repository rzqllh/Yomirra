import { getRecentSearchCatalogRecords, upsertSearchCatalogRecords, buildTrustedCatalogCandidate } from "./semantic-catalog";
import { isSemanticEmbeddingConfigured } from "./gemini-embeddings";
import { rankSearchIntelligence } from "./search-intelligence-service";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { parseSearchExpression, type SearchCatalogCandidate } from "@/shared/lib/search-intelligence";
import { logger } from "@/shared/logger";
import type {
  SearchIntelligenceStats,
  SearchSimulationResult,
  SearchSimulationResultItem,
} from "@/shared/types/admin";


export async function getSearchIntelligenceStats(): Promise<SearchIntelligenceStats> {
  const records = await getRecentSearchCatalogRecords(500);
  const total = records.length;
  const embedded = records.filter((r) => r.embedding && r.embedding.length > 0).length;
  const coverage = total > 0 ? Math.round((embedded / total) * 100) : 0;
  const isGeminiConfigured = isSemanticEmbeddingConfigured();

  return {
    totalCatalogItems: total,
    totalCatalogRecords: total,
    embeddedRecordsCount: embedded,
    embeddingsActive: isGeminiConfigured && embedded > 0,
    embeddingCoveragePercent: coverage,
    isGeminiConfigured,
    model: "text-embedding-004",
    lastWarmedAt: records[0]?.updatedAt ? new Date(records[0].updatedAt).toISOString() : undefined,
  };
}

export async function warmSearchCatalog(): Promise<{ addedCount: number; totalCount: number; warmedCount: number }> {
  const activeSources = sourceRegistry.filter((s) => s.isEnabled && s.isInstalled && s.status !== "unavailable");
  const candidates: SearchCatalogCandidate[] = [];

  for (const sourceMeta of activeSources.slice(0, 3)) {
    try {
      const source = await sourceManager.getSource(sourceMeta.id);
      const popular = await source.getPopular(1);
      if (popular?.mangas && Array.isArray(popular.mangas)) {
        for (const item of popular.mangas.slice(0, 10)) {
          candidates.push(buildTrustedCatalogCandidate(sourceMeta.id, item));
        }
      }
    } catch (err) {
      logger.warn(`Failed to pull popular for warming from ${sourceMeta.id}`, { err });
    }
  }

  if (candidates.length > 0) {
    await upsertSearchCatalogRecords(candidates);
  }

  const all = await getRecentSearchCatalogRecords(500);
  return { addedCount: candidates.length, totalCount: all.length, warmedCount: candidates.length };
}

export async function simulateSearchRanking(rawQuery: string): Promise<SearchSimulationResult> {
  const { textQuery: query, tags } = parseSearchExpression(rawQuery);
  const records = await getRecentSearchCatalogRecords(100);

  let candidates: SearchCatalogCandidate[];
  let catalogEmpty = false;

  if (records.length === 0) {
    // Fallback: build synthetic candidates from source registry metadata
    catalogEmpty = true;
    candidates = sourceRegistry
      .filter((s) => s.isEnabled && s.isInstalled)
      .map((s) => ({
        canonicalKey: `source:${s.id}:__meta`,
        sourceId: s.id,
        mangaId: "__meta",
        title: s.name,
        description: s.description,
        score: 0,
        sourceBindings: [],
      }));
  } else {
    candidates = records;
  }

  const result = await rankSearchIntelligence({
    query,
    tags,
    candidates,
  });

  const rankedResults: SearchSimulationResultItem[] = candidates.map((c) => {
    const score = result.scores[c.canonicalKey] || 0;
    return {
      id: c.canonicalKey,
      canonicalKey: c.canonicalKey,
      title: c.title,
      sourceId: c.sourceId,
      exactMatchScore: c.title.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0.0,
      tagMatchScore: tags.length > 0 ? 0.8 : 0.0,
      popularityScore: typeof c.score === "number" ? Math.round(c.score * 10) / 10 : 0,
      finalScore: score,
      hasEmbedding: Boolean(records.find((r) => r.canonicalKey === c.canonicalKey)?.embedding),
    };
  }).sort((a, b) => b.finalScore - a.finalScore);

  return {
    query,
    semanticAvailable: result.semanticAvailable,
    catalogEmpty,
    results: rankedResults,
    rankedResults,
  };
}
