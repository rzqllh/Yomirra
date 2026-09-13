/**
 * Title normalization and cross-source matching utilities.
 *
 * MatchConfidence semantics:
 *   CONFIRMED      — explicit user-confirmed link; only user action can set this.
 *   HIGH_CONFIDENCE — strong heuristic (normalized title + author both match).
 *   AMBIGUOUS      — possible match; requires user inspection/selection.
 *   NO_MATCH       — insufficient similarity.
 *
 * Rule: heuristics never silently promote a result to CONFIRMED.
 */

export type MatchConfidence =
  | "CONFIRMED"
  | "HIGH_CONFIDENCE"
  | "AMBIGUOUS"
  | "NO_MATCH";

export interface TitleCandidate {
  sourceId: string;
  mangaId: string;
  title: string;
  alternativeTitles?: string[];
  author?: string;
  status?: string;
  coverUrl?: string;
}

export interface MatchResult {
  confidence: MatchConfidence;
  score: number; // 0–1 for informational ordering
  normalizedQueryTitle: string;
  normalizedCandidateTitle: string;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a title for comparison purposes.
 * Lowercases, strips accents, removes non-alphanumeric characters except spaces,
 * collapses whitespace.
 */
export function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9 ]/g, " ") // non-alnum → space
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Levenshtein distance (for fuzzy matching)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const levScore = 1 - dist / maxLen;

  // Substring / prefix containment (common with subtitles, sequels, side stories)
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (longer.startsWith(shorter) || longer.includes(shorter)) {
    const containment = shorter.length / longer.length;
    // Boost score into AMBIGUOUS range (0.75 - 0.88)
    const boosted = 0.65 + 0.25 * containment;
    return Math.max(levScore, Math.min(0.88, boosted));
  }

  // Token Jaccard overlap for rearranged titles
  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  if (union > 0) {
    const jaccard = intersection / union;
    if (jaccard >= 0.5) {
      const tokenScore = 0.65 + 0.25 * jaccard;
      return Math.max(levScore, Math.min(0.88, tokenScore));
    }
  }

  return levScore;
}

// ---------------------------------------------------------------------------
// Core match function
// ---------------------------------------------------------------------------

/**
 * Compares a query title/author against a candidate.
 * Does NOT check alternate titles — call matchAgainstAlternates if needed.
 */
export function matchTitles(
  queryTitle: string,
  candidateTitle: string,
  queryAuthor?: string,
  candidateAuthor?: string
): MatchResult {
  const normQuery = normalizeTitle(queryTitle);
  const normCandidate = normalizeTitle(candidateTitle);

  const titleScore = similarityScore(normQuery, normCandidate);

  let authorMatch = false;
  if (queryAuthor && candidateAuthor) {
    const normQA = normalizeTitle(queryAuthor);
    const normCA = normalizeTitle(candidateAuthor);
    authorMatch = similarityScore(normQA, normCA) >= 0.85;
  }
  const authorKnown = !!queryAuthor && !!candidateAuthor;

  let confidence: MatchConfidence;
  if (titleScore === 1 && (!authorKnown || authorMatch)) {
    // Exact normalized title; author either matches or is unknown on one side
    confidence = "HIGH_CONFIDENCE";
  } else if (titleScore >= 0.9 && (!authorKnown || authorMatch)) {
    confidence = "HIGH_CONFIDENCE";
  } else if (titleScore >= 0.75) {
    confidence = "AMBIGUOUS";
  } else {
    confidence = "NO_MATCH";
  }

  return {
    confidence,
    score: titleScore,
    normalizedQueryTitle: normQuery,
    normalizedCandidateTitle: normCandidate,
  };
}

/**
 * Checks a query against a candidate's primary title and all alternate titles.
 * Returns the best match found.
 */
export function matchAgainstAlternates(
  queryTitle: string,
  candidate: TitleCandidate,
  queryAuthor?: string
): MatchResult {
  const allTitles = [
    candidate.title,
    ...(candidate.alternativeTitles ?? []),
  ];

  let best: MatchResult = {
    confidence: "NO_MATCH",
    score: 0,
    normalizedQueryTitle: normalizeTitle(queryTitle),
    normalizedCandidateTitle: normalizeTitle(candidate.title),
  };

  for (const t of allTitles) {
    const result = matchTitles(queryTitle, t, queryAuthor, candidate.author);
    if (result.score > best.score) {
      best = result;
    }
  }

  return best;
}

/**
 * Ranks a list of candidates from best to worst against the query.
 * Filters out NO_MATCH results.
 */
export function rankCandidates(
  queryTitle: string,
  candidates: TitleCandidate[],
  queryAuthor?: string
): Array<{ candidate: TitleCandidate; result: MatchResult }> {
  return candidates
    .map((c) => ({
      candidate: c,
      result: matchAgainstAlternates(queryTitle, c, queryAuthor),
    }))
    .filter((x) => x.result.confidence !== "NO_MATCH")
    .sort((a, b) => b.result.score - a.result.score);
}
