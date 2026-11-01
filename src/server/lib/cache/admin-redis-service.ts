import { redis } from "./redis";
import { physicalScanPattern, physicalToLogicalRedisKey } from "./redis-key-scope";
import { logger } from "@/shared/logger";
import type { RedisKeyDetail, RedisKeyItem, RedisTelemetry } from "@/shared/types/admin";

/**
 * Mengambil ringkasan telemetri Redis (penggunaan memori, uptime, client, total key yomirra).
 */
const MAX_SCAN_ITERATIONS = 200;
const MAX_ADMIN_KEYS = 1000;

/**
 * Redis SCAN returns physical keys and does NOT apply ioredis keyPrefix to MATCH.
 * Prefix the scan pattern manually, then strip only keys belonging to this branch.
 * The iteration cap prevents unbounded work on a shared Redis service.
 */
export async function scanRedisKeys(pattern = "yomirra:*", limit = 100): Promise<RedisKeyItem[]> {
  const maxKeys = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), MAX_ADMIN_KEYS)) : 100;
  try {
    const physicalPattern = physicalScanPattern(pattern);
    const results: RedisKeyItem[] = [];
    const seen = new Set<string>();
    let cursor = "0";
    let iterations = 0;

    do {
      const [next, scanned] = await redis.scan(cursor, "MATCH", physicalPattern, "COUNT", 100);
      cursor = next;
      iterations += 1;

      for (const physicalKey of scanned) {
        const key = physicalToLogicalRedisKey(physicalKey);
        if (key === null || seen.has(key)) continue;
        seen.add(key);
        const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
        results.push({ key, type, ttl });
        if (results.length >= maxKeys) break;
      }
    } while (cursor !== "0" && iterations < MAX_SCAN_ITERATIONS && results.length < maxKeys);

    return results;
  } catch (error) {
    logger.warn("Gagal scan keys Redis", { pattern, error });
    return [];
  }
}

/**
 * Telemetry is sampled and scoped to logical Yomirra application keys.
 * Redis INFO memory/client figures remain instance-wide.
 */
export async function getRedisTelemetry(): Promise<RedisTelemetry> {
  try {
    const rawInfo = await redis.info();
    const keys = await scanRedisKeys("yomirra:*", MAX_ADMIN_KEYS);

    let usedMemory = "0B";
    let uptimeDays = 0;
    let connectedClients = 0;
    for (const line of (rawInfo || "").split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("used_memory_human:")) usedMemory = trimmed.split(":")[1]?.trim() || "0B";
      else if (trimmed.startsWith("uptime_in_days:")) uptimeDays = parseInt(trimmed.split(":")[1]?.trim() || "0", 10);
      else if (trimmed.startsWith("connected_clients:")) connectedClients = parseInt(trimmed.split(":")[1]?.trim() || "0", 10);
    }

    return {
      usedMemory,
      uptimeDays,
      connectedClients,
      totalSampledKeys: keys.length,
      status: "connected",
    };
  } catch (error) {
    logger.warn("Gagal membaca telemetri Redis, kembalikan status fallback", { error });
    return { usedMemory: "0B", uptimeDays: 0, connectedClients: 0, totalSampledKeys: 0, status: "disconnected" };
  }
}

/**
 * Mengambil detail isi key Redis untuk inspeksi admin.
 */
export async function getRedisKeyDetail(key: string): Promise<RedisKeyDetail | null> {
  try {
    const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);

    let value = "";
    if (type === "string") {
      value = (await redis.get(key)) || "";
    } else {
      value = `[Data tipe ${type}]`;
    }

    return {
      key,
      type,
      ttl,
      value,
    };
  } catch (error) {
    logger.warn("Gagal membaca detail key Redis", { key, error });
    return null;
  }
}

/**
 * Menghapus satu key Redis secara aman.
 */
export async function deleteRedisKey(key: string): Promise<boolean> {
  try {
    const deletedCount = await redis.del(key);
    return deletedCount > 0;
  } catch (error) {
    logger.error("Gagal menghapus key Redis", { key, error });
    return false;
  }
}
