import { SourceError, type SourceHealthStage } from "./error";
import { withSourceCapacity } from "./source-capacity";

const FAILURE_WINDOW_MS = 30_000;
const NEGATIVE_TTL_MS = 30_000;
const MAX_CIRCUITS = 256;
const MAX_MISSING = 512;
const circuitCodes = new Set(["UPSTREAM_BLOCKED", "UPSTREAM_TIMEOUT", "RATE_LIMITED", "SOURCE_DOWN", "ROUTE_CHANGED", "SCHEMA_CHANGED", "PARSER_BROKEN"]);

type Circuit = { failures: number; expiresAt: number; until: number; probing: boolean; error: SourceError };
const circuits = new Map<string, Circuit>();
const missing = new Map<string, { expiresAt: number; error: SourceError }>();

export async function loadSourceUpstream<T>(
  sourceId: string,
  stage: SourceHealthStage,
  resourceKey: string | null,
  load: () => Promise<T>,
  circuitScope = sourceId,
): Promise<T> {
  const now = Date.now();
  const negative = resourceKey ? missing.get(resourceKey) : undefined;
  if (negative && now < negative.expiresAt) throw negative.error;
  if (negative && resourceKey) missing.delete(resourceKey);

  return withSourceCapacity(circuitScope, async () => {
    const previous = circuits.get(circuitScope);
    if (previous && (previous.until > now || previous.probing)) {
      const rateLimited = previous.error.code === "RATE_LIMITED";
      throw new SourceError("Sumber sedang dijeda. Coba lagi sebentar.", {
        code: previous.error.code,
        sourceId,
        stage,
        statusCode: rateLimited ? 429 : 503,
        retryAfterSeconds: Math.max(1, Math.ceil((previous.until - now) / 1000)),
      });
    }

    const halfOpen = Boolean(previous?.until);
    if (previous && halfOpen) previous.probing = true;
    const clearCurrentCircuit = () => {
      if (circuits.get(circuitScope) === previous) circuits.delete(circuitScope);
    };
    try {
      const result = await load();
      clearCurrentCircuit();
      return result;
    } catch (cause) {
      const error = SourceError.classify(cause, sourceId, stage);
      if (resourceKey && resourceKey.length <= 768 && error.code === "CONTENT_NOT_FOUND") {
        if (missing.size >= MAX_MISSING) missing.delete(missing.keys().next().value!);
        missing.set(resourceKey, { error, expiresAt: Date.now() + NEGATIVE_TTL_MS });
        if (halfOpen) clearCurrentCircuit();
      } else if (circuitCodes.has(error.code)) {
        const failedAt = Date.now();
        const current = circuits.get(circuitScope);
        if (!current || current.until <= failedAt || halfOpen) {
          const failures = current && current.expiresAt > failedAt ? current.failures + 1 : 1;
          const cooldownSeconds = error.code === "RATE_LIMITED" ? error.retryAfterSeconds ?? 30 : 20;
          const open = halfOpen || error.code === "RATE_LIMITED" || failures >= 2;
          if (!current && circuits.size >= MAX_CIRCUITS) circuits.delete(circuits.keys().next().value!);
          circuits.set(circuitScope, {
            failures, expiresAt: failedAt + FAILURE_WINDOW_MS,
            until: open ? failedAt + cooldownSeconds * 1000 : 0,
            probing: false, error,
          });
        }
      } else if (halfOpen) {
        clearCurrentCircuit();
      }
      throw error;
    } finally {
      if (previous && halfOpen) previous.probing = false;
    }
  });
}
