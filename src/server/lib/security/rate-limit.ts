import {
  ensureRedisReady,
  isRedisConfigured,
  redis,
} from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { NextResponse } from "next/server";

export interface RateLimitResult {
  success: boolean;
  headers: Record<string, string>;
  unavailable?: boolean;
}

export const RATE_LIMIT_POLICIES = {
  adminMutation: {
    limit: 30,
    window: 60,
    failClosed: true,
    namespace: "admin-mutation",
  },
  adminExpensive: {
    limit: 10,
    window: 60,
    failClosed: true,
    namespace: "admin-expensive",
  },
  publicSearch: {
    limit: 120,
    window: 60,
    failClosed: false,
    namespace: "public-search",
  },
  publicAi: {
    limit: 12,
    window: 60,
    failClosed: true,
    namespace: "public-ai",
  },
  searchIntelligence: {
    limit: 10,
    window: 60,
    failClosed: true,
    namespace: "search-intelligence",
  },
  imageProxy: {
    limit: 600,
    window: 60,
    failClosed: false,
    namespace: "image-proxy",
  },
  userReport: {
    limit: 5,
    window: 10 * 60,
    failClosed: true,
    namespace: "user-report",
  },
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

const MAX_LOCAL_COUNTERS = 4096;
const localCounters = new Map<string, { count: number; expiresAt: number }>();
let nextSweep = 0;

function checkLocalRateLimit(key: string, limit: number, window: number): RateLimitResult {
  const now = Date.now();
  if (now >= nextSweep) {
    for (const [key, counter] of localCounters) {
      if (counter.expiresAt <= now) localCounters.delete(key);
    }
    nextSweep = now + 1000;
  }

  let counter = localCounters.get(key);
  if (!counter || counter.expiresAt <= now) {
    // Keep live counters even during a flood of new identities.
    if (!counter && localCounters.size >= MAX_LOCAL_COUNTERS) {
      return {
        success: false,
        headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(window) },
      };
    }
    counter = { count: 0, expiresAt: now + window * 1000 };
    localCounters.set(key, counter);
  }
  if (counter.count <= limit) counter.count += 1;

  return {
    success: counter.count <= limit,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(Math.max(0, limit - counter.count)),
      "X-RateLimit-Reset": String(Math.ceil((counter.expiresAt - now) / 1000)),
    },
  };
}

function getRateLimitIdentity(request: Request): string {
  // Use the right-most proxy-observed hop instead of trusting a client-prepended
  // x-forwarded-for value. x-real-ip remains a fallback for local/proxy setups.
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .at(-1);
  const realIp = request.headers.get("x-real-ip")?.trim();

  return (forwarded || realIp || "unknown").slice(0, 64);
}

export async function checkRateLimit(
  request: Request,
  limit: number = process.env.NODE_ENV === "development" ? 1000 : 300,
  window: number = 60,
  failClosed: boolean = false,
  namespace?: string
): Promise<RateLimitResult> {
  try {
    const identity = getRateLimitIdentity(request);
    const key = namespace
      ? `rate-limit:${namespace}:${identity}`
      : `rate-limit:${identity}`;

    if (process.env.NODE_ENV === "development") {
      return {
        success: true,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": limit.toString(),
          "X-RateLimit-Reset": window.toString(),
        },
      };
    }

    if (!failClosed) return checkLocalRateLimit(key, limit, window);

    if (!isRedisConfigured) {
      return {
        success: false,
        unavailable: true,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": limit.toString(),
          "X-RateLimit-Reset": window.toString(),
        },
      };
    }

    await ensureRedisReady();

    const requests = await redis.incr(key);

    let ttl = await redis.ttl(key);
    if (requests === 1 || ttl === -1) {
      await redis.expire(key, window);
      ttl = window;
    }

    return {
      success: requests <= limit,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": Math.max(0, limit - requests).toString(),
        "X-RateLimit-Reset": Math.max(0, ttl).toString(),
      },
    };
  } catch (error) {
    logger.warn("Rate limit check unavailable", { error });
    return {
      success: false,
      unavailable: true,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": limit.toString(),
        "X-RateLimit-Reset": window.toString(),
      },
    };
  }
}

export async function checkRateLimitPolicy(
  request: Request,
  policyName: RateLimitPolicyName,
  scope?: string
): Promise<RateLimitResult> {
  const policy = RATE_LIMIT_POLICIES[policyName];
  const namespace = scope
    ? `${policy.namespace}:${scope}`
    : policy.namespace;

  return checkRateLimit(
    request,
    policy.limit,
    policy.window,
    policy.failClosed,
    namespace
  );
}

export function applyRateLimitHeaders<T extends Response>(
  response: T,
  rateLimit: Pick<RateLimitResult, "headers">
): T {
  for (const [key, value] of Object.entries(rateLimit.headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function createRateLimitRejection(
  rateLimit: RateLimitResult,
  options?: {
    unavailableMessage?: string;
    tooManyMessage?: string;
  }
): NextResponse {
  const unavailable = Boolean(rateLimit.unavailable);
  const headers = {
    ...rateLimit.headers,
    "Retry-After":
      rateLimit.headers["X-RateLimit-Reset"] ||
      RATE_LIMIT_POLICIES.adminMutation.window.toString(),
  };

  return NextResponse.json(
    {
      error: {
        message: unavailable
          ? options?.unavailableMessage || "Service temporarily unavailable"
          : options?.tooManyMessage || "Too Many Requests",
      },
    },
    {
      status: unavailable ? 503 : 429,
      headers,
    }
  );
}
