import {
  buildCatalogText,
  candidateMatchesTags,
  lexicalSearchScore,
  shouldUseSemanticSearch,
  type ResolvedSearchTag,
  type SearchCatalogCandidate,
} from "@/shared/lib/search-intelligence";
import {
  getRecentSearchCatalogRecords,
  getSearchCatalogRecord,
  hashEmbeddingText,
  upsertSearchCatalogRecords,
  type StoredSearchCatalogRecord,
} from "./semantic-catalog";
import {
  cosineSimilarity,
  embedSearchText,
  isSemanticEmbeddingConfigured,
} from "./gemini-embeddings";

export interface SearchIntelligenceResult {
  semanticAvailable: boolean;
  scores: Record<string, number>;
  catalogMatches: SearchCatalogCandidate[];
}

function clampSimilarity(value: number): number {
  return Math.max(0, Math.min(1, value));
}

async function ensureCandidateEmbedding(
  candidate: SearchCatalogCandidate,
  stored?: StoredSearchCatalogRecord | null
): Promise<{ values: number[]; textHash: string } | null> {
  const text = buildCatalogText(candidate);
  const textHash = hashEmbeddingText(text);

  if (
    stored?.embedding &&
    stored.embedding.length > 0 &&
    stored.embeddingTextHash === textHash
  ) {
    return { values: stored.embedding, textHash };
  }

  const values = await embedSearchText(text);
  return values ? { values, textHash } : null;
}

export async function rankSearchIntelligence(params: {
  query: string;
  tags: ResolvedSearchTag[];
  candidates: SearchCatalogCandidate[];
}): Promise<SearchIntelligenceResult> {
  const query = params.query.trim();
  const candidates = Array.from(
    new Map(params.candidates.slice(0, 40).map((candidate) => [candidate.canonicalKey, candidate])).values()
  );

  const recent = await getRecentSearchCatalogRecords(240);
  const recentByKey = new Map(recent.map((record) => [record.canonicalKey, record]));
  const scores: Record<string, number> = {};
  const semanticEnabled =
    isSemanticEmbeddingConfigured() &&
    shouldUseSemanticSearch(query);

  if (semanticEnabled) {
    const queryVector = await embedSearchText(query);

    if (queryVector) {
      const missing = candidates
        .filter((candidate) => {
          const stored = recentByKey.get(candidate.canonicalKey);
          const textHash = hashEmbeddingText(buildCatalogText(candidate));
          return !stored?.embedding || stored.embeddingTextHash !== textHash;
        })
        .sort((a, b) => lexicalSearchScore(query, b) - lexicalSearchScore(query, a))
        .slice(0, 6);

      const generatedPairs = await Promise.all(
        missing.map(async (candidate) => ({
          candidate,
          embedding: await ensureCandidateEmbedding(
            candidate,
            recentByKey.get(candidate.canonicalKey)
          ),
        }))
      );

      const generated = new Map<string, { values: number[]; textHash: string }>();
      for (const pair of generatedPairs) {
        if (pair.embedding) generated.set(pair.candidate.canonicalKey, pair.embedding);
      }

      for (const candidate of candidates) {
        const embedding =
          generated.get(candidate.canonicalKey)?.values ??
          recentByKey.get(candidate.canonicalKey)?.embedding;
        if (!embedding) continue;
        scores[candidate.canonicalKey] = clampSimilarity(
          cosineSimilarity(queryVector, embedding)
        );
      }

      const trustedMissing = recent
        .filter((record) => !record.embedding && candidateMatchesTags(record, params.tags))
        .sort((a, b) => lexicalSearchScore(query, b) - lexicalSearchScore(query, a))
        .slice(0, 6);

      const trustedPairs = await Promise.all(
        trustedMissing.map(async (record) => ({
          record,
          embedding: await ensureCandidateEmbedding(record, record),
        }))
      );
      const trustedGenerated = new Map<string, { values: number[]; textHash: string }>();
      for (const pair of trustedPairs) {
        if (pair.embedding) trustedGenerated.set(pair.record.canonicalKey, pair.embedding);
      }
      if (trustedGenerated.size > 0) {
        await upsertSearchCatalogRecords(trustedMissing, trustedGenerated);
      }

      for (const record of recent) {
        const embedding =
          trustedGenerated.get(record.canonicalKey)?.values ??
          record.embedding;
        if (!embedding || !candidateMatchesTags(record, params.tags)) continue;
        const semantic = clampSimilarity(cosineSimilarity(queryVector, embedding));
        if (semantic > (scores[record.canonicalKey] ?? 0)) {
          scores[record.canonicalKey] = semantic;
        }
      }
    }
  }

  const currentKeys = new Set(candidates.map((candidate) => candidate.canonicalKey));
  const catalogMatches = recent
    .filter((record) => !currentKeys.has(record.canonicalKey))
    .filter((record) => candidateMatchesTags(record, params.tags))
    .map((record) => {
      const lexical = query ? lexicalSearchScore(query, record) : 0;
      const semantic = scores[record.canonicalKey] ?? 0;
      const score = semanticEnabled
        ? Math.max(lexical, semantic)
        : lexical;
      return { record, score };
    })
    .filter(({ score }) => {
      if (!query) return params.tags.length > 0;
      return score >= (semanticEnabled ? 0.58 : 0.72);
    })
    .sort((a, b) => b.score - a.score || b.record.updatedAt - a.record.updatedAt)
    .slice(0, 8)
    .map(({ record }) => {
      const { embedding: _embedding, embeddingTextHash: _hash, updatedAt: _updatedAt, ...candidate } = record;
      return candidate;
    });

  return {
    semanticAvailable: semanticEnabled && Object.keys(scores).length > 0,
    scores,
    catalogMatches,
  };
}

export async function findRelatedSearchTitles(
  target: SearchCatalogCandidate,
  limit = 8
): Promise<SearchCatalogCandidate[]> {
  if (!isSemanticEmbeddingConfigured()) return [];

  const storedTarget = await getSearchCatalogRecord(target.canonicalKey);
  const targetEmbedding = await ensureCandidateEmbedding(target, storedTarget);
  if (!targetEmbedding) return [];

  const recent = await getRecentSearchCatalogRecords(300);
  return recent
    .filter((record) => record.canonicalKey !== target.canonicalKey && record.embedding)
    .map((record) => ({
      record,
      score: clampSimilarity(cosineSimilarity(targetEmbedding.values, record.embedding!)),
    }))
    .filter(({ score }) => score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map(({ record }) => {
      const { embedding: _embedding, embeddingTextHash: _hash, updatedAt: _updatedAt, ...candidate } = record;
      return candidate;
    });
}
