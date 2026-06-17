import { redis } from "@/server/lib/cache/redis";
import { NextRequest } from "next/server";

export async function checkRateLimit(
  request: NextRequest,
  limit: number = process.env.NODE_ENV === "development" ? 1000 : 300, // requests
  window: number = 60 // seconds
): Promise<{ success: boolean; headers: Record<string, string> }> {
  try {
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const key = `rate-limit:${ip}`;

    const requests = await redis.incr(key);
    
    if (requests === 1) {
      await redis.expire(key, window);
    }

    const ttl = await redis.ttl(key);

    return {
      success: requests <= limit,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": Math.max(0, limit - requests).toString(),
        "X-RateLimit-Reset": ttl.toString(),
      },
    };
  } catch (error) {
    console.error("Rate limit check failed (Redis might be down), bypassing:", error instanceof Error ? error.message : "Unknown error");
    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": limit.toString(),
        "X-RateLimit-Reset": window.toString(),
      },
    };
  }
}
