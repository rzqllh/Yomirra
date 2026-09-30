import {
  buildCatalogText,
  candidateMatchesTags,
  lexicalSearchScore,
  shouldUseSemanticSearch,
  similarity,
  type ResolvedSearchTag,
  type SearchCatalogCandidate,
} from "@/shared/lib/search-intelligence";
import { normalizeTitle } from "@/shared/lib/title-matcher";
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

export function metadataRelatedScore(
  target: SearchCatalogCandidate,
  candidate: SearchCatalogCandidate
): number {
  let score = 0;

  // Author match (strong signal)
  if (target.author && candidate.author) {
    const targetAuthor = normalizeTitle(target.author);
    const candAuthor = normalizeTitle(candidate.author);
    if (targetAuthor && candAuthor && targetAuthor === candAuthor) {
      score += 0.35;
    }
  }

  // Format match (e.g. Manga, Manhwa, Manhua)
  if (target.format && candidate.format && target.format.toLowerCase() === candidate.format.toLowerCase()) {
    score += 0.15;
  }

  // Genre overlap (Jaccard similarity)
  if (target.genres && target.genres.length > 0 && candidate.genres && candidate.genres.length > 0) {
    const targetSet = new Set(target.genres.map((g) => g.toLowerCase().trim()));
    const candSet = new Set(candidate.genres.map((g) => g.toLowerCase().trim()));
    let intersection = 0;
    for (const g of candSet) {
      if (targetSet.has(g)) intersection++;
    }
    const union = new Set([...targetSet, ...candSet]).size;
    if (union > 0) {
      score += (intersection / union) * 0.35;
    }
  }

  // Title lexical similarity (sequels, spin-offs, adaptations)
  const normTarget = normalizeTitle(target.title);
  const normCand = normalizeTitle(candidate.title);
  if (normTarget && normCand) {
    const titleSim = similarity(normTarget, normCand);
    if (titleSim > 0.4) {
      score += titleSim * 0.25;
    }
  }

  return Math.min(1, score);
}

export async function findRelatedSearchTitles(
  target: SearchCatalogCandidate,
  limit = 8
): Promise<SearchCatalogCandidate[]> {
  const recent = await getRecentSearchCatalogRecords(300);
  const otherRecords = recent.filter((record) => record.canonicalKey !== target.canonicalKey);
  if (otherRecords.length === 0) return [];

  const semanticEnabled = isSemanticEmbeddingConfigured();
  let targetEmbedding: { values: number[]; textHash: string } | null = null;

  if (semanticEnabled) {
    const storedTarget = await getSearchCatalogRecord(target.canonicalKey);
    targetEmbedding = await ensureCandidateEmbedding(target, storedTarget);
  }

  return otherRecords
    .map((record) => {
      const metaScore = metadataRelatedScore(target, record);
      let finalScore = metaScore;

      if (targetEmbedding && record.embedding) {
        const semScore = clampSimilarity(cosineSimilarity(targetEmbedding.values, record.embedding));
        finalScore = Math.max(metaScore, semScore * 0.7 + metaScore * 0.3);
      }

      return { record, score: finalScore };
    })
    .filter(({ score }) => score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map(({ record }) => {
      const { embedding: _embedding, embeddingTextHash: _hash, updatedAt: _updatedAt, ...candidate } = record;
      return candidate;
    });
}
