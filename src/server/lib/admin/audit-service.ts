import { randomUUID } from "node:crypto";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";

export interface AdminAuditActor {
  uid: string;
  email?: string;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actor: AdminAuditActor;
  action: string;
  targetType: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

const AUDIT_LOG_KEY = "yomirra:admin:audit:log";
const MAX_AUDIT_LOG_ENTRIES = 100;

// In-memory fallback if Redis is unavailable
const inMemoryAuditLog: AdminAuditEntry[] = [];

/**
 * Filter out sensitive values so credentials and tokens are never logged.
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;

  const sanitized: Record<string, unknown> = {};
  const sensitiveRegex = /(token|secret|password|key|credential|auth|cert)/i;

  for (const [k, v] of Object.entries(metadata)) {
    if (sensitiveRegex.test(k)) {
      continue;
    }
    // Limit scalar size or serialization
    if (typeof v === "string" && v.length > 500) {
      sanitized[k] = `${v.slice(0, 500)}… (truncated)`;
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

/**
 * Record an audit log entry for a privileged administrator action.
 */
export async function recordAdminAudit(
  entry: Omit<AdminAuditEntry, "id" | "timestamp">
): Promise<AdminAuditEntry> {
  const auditEntry: AdminAuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor: {
      uid: entry.actor.uid || "anonymous",
      email: entry.actor.email,
    },
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    summary: entry.summary,
    metadata: sanitizeMetadata(entry.metadata),
  };

  inMemoryAuditLog.unshift(auditEntry);
  if (inMemoryAuditLog.length > MAX_AUDIT_LOG_ENTRIES) {
    inMemoryAuditLog.pop();
  }

  if (isRedisConfigured) {
    try {
      await redis
        .multi()
        .lpush(AUDIT_LOG_KEY, JSON.stringify(auditEntry))
        .ltrim(AUDIT_LOG_KEY, 0, MAX_AUDIT_LOG_ENTRIES - 1)
        .exec();
    } catch (err) {
      logger.warn("Failed to persist admin audit log to Redis, retained in memory", { err });
    }
  }

  return auditEntry;
}

/**
 * Retrieve recent admin audit log entries.
 */
export async function getAdminAuditLog(limit = 50): Promise<AdminAuditEntry[]> {
  const bound = Math.min(Math.max(1, limit), MAX_AUDIT_LOG_ENTRIES);

  if (isRedisConfigured) {
    try {
      const rawEntries = await redis.lrange(AUDIT_LOG_KEY, 0, bound - 1);
      if (rawEntries && rawEntries.length > 0) {
        return rawEntries.map((raw) => JSON.parse(raw) as AdminAuditEntry);
      }
    } catch (err) {
      logger.warn("Failed to read admin audit log from Redis, reading from in-memory fallback", { err });
    }
  }

  return inMemoryAuditLog.slice(0, bound);
}
