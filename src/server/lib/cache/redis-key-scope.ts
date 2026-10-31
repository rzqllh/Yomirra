import { createHash } from "node:crypto";

export interface RedisRuntimeIdentity {
  vercelEnv?: string;
  branch?: string;
}

/**
 * Production uses its existing, unprefixed keys, so no production migration
 * occurs when this protection is released. Preview builds on *every branch*
 * get a distinct namespace, while successive deployments of a branch reuse it.
 *
 * Important: a Redis key prefix is accidental-write isolation, NOT a security
 * boundary between principals with the same Redis credentials. Preview should
 * use a key-restricted ACL user or separately provisioned credentials.
 */
export function getRedisKeyNamespace({ vercelEnv, branch }: RedisRuntimeIdentity): string {
  if (vercelEnv === "preview") {
    const digest = createHash("sha256")
      .update(branch || "unknown-preview-branch")
      .digest("hex")
      .slice(0, 16);
    return `yomirra:preview:${digest}:`;
  }
  if (vercelEnv === "development") return "yomirra:development:";
  return "";
}

export const redisKeyNamespace = getRedisKeyNamespace({
  vercelEnv: process.env.VERCEL_ENV,
  branch: process.env.VERCEL_GIT_COMMIT_REF,
});

/** Redis SCAN/KEYS patterns are not automatically prefixed by ioredis. */
export function physicalScanPattern(pattern: string, namespace = redisKeyNamespace): string {
  return namespace + pattern;
}

/** Strip only *this* environment's physical namespace; never return keys from others. */
export function physicalToLogicalRedisKey(
  physicalKey: string,
  namespace = redisKeyNamespace
): string | null {
  if (!namespace) return physicalKey;
  return physicalKey.startsWith(namespace) ? physicalKey.slice(namespace.length) : null;
}
