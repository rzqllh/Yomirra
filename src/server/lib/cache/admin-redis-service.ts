import { redis } from "./redis";
import { logger } from "@/shared/logger";
import type { RedisKeyDetail, RedisKeyItem, RedisTelemetry } from "@/shared/types/admin";

/**
 * Mengambil ringkasan telemetri Redis (penggunaan memori, uptime, client, total key yomirra).
 */
export async function getRedisTelemetry(): Promise<RedisTelemetry> {
  try {
    const rawInfo = await redis.info();
    const keys = await redis.keys("yomirra:*");

    let usedMemory = "0B";
    let uptimeDays = 0;
    let connectedClients = 0;

    const lines = (rawInfo || "").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("used_memory_human:")) {
        usedMemory = trimmed.split(":")[1]?.trim() || "0B";
      } else if (trimmed.startsWith("uptime_in_days:")) {
        uptimeDays = parseInt(trimmed.split(":")[1]?.trim() || "0", 10);
      } else if (trimmed.startsWith("connected_clients:")) {
        connectedClients = parseInt(trimmed.split(":")[1]?.trim() || "0", 10);
      }
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
    return {
      usedMemory: "0B",
      uptimeDays: 0,
      connectedClients: 0,
      totalSampledKeys: 0,
      status: "disconnected",
    };
  }
}

/**
 * Scan key Redis berdasarkan pola tertentu (default: yomirra:*).
 */
export async function scanRedisKeys(pattern = "yomirra:*", limit = 100): Promise<RedisKeyItem[]> {
  try {
    const matchedKeys = await redis.keys(pattern);
    const slice = matchedKeys.slice(0, limit);

    const items = await Promise.all(
      slice.map(async (key) => {
        try {
          const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
          return { key, type, ttl };
        } catch {
          return { key, type: "unknown", ttl: -1 };
        }
      })
    );

    return items;
  } catch (error) {
    logger.warn("Gagal scan keys Redis", { pattern, error });
    return [];
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
