import { createHash } from "node:crypto";
import { env } from "@/env";
import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";

const MODEL = "gemini-embedding-2";
const DIMENSIONS = 768;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

interface GeminiEmbeddingResponse {
  embedding?: { values?: number[] };
  embeddings?: Array<{ values?: number[] }>;
}

function cacheKey(text: string): string {
  const hash = createHash("sha256").update(text).digest("hex");
  return `yomirra:search:embedding:${hash}`;
}

export function isSemanticEmbeddingConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export async function embedSearchText(text: string): Promise<number[] | null> {
  const clean = text.trim();
  if (!clean || !env.GEMINI_API_KEY) return null;

  const key = cacheKey(clean);
  try {
    const cached = await redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached) as number[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Redis cache is optional.
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: `models/${MODEL}`,
          content: { parts: [{ text: clean }] },
          output_dimensionality: DIMENSIONS,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      logger.warn("Gemini embedding request failed", { status: response.status });
      return null;
    }

    const data = (await response.json()) as GeminiEmbeddingResponse;
    const values = data.embedding?.values ?? data.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length === 0) return null;

    try {
      await redis.set(key, JSON.stringify(values), "EX", CACHE_TTL_SECONDS);
    } catch {
      // Redis cache is optional.
    }

    return values;
  } catch (error) {
    logger.debug("Gemini embedding unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
