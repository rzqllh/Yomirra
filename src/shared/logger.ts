import { env } from "@/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY =
  /(?:authorization|cookie|set-cookie|token|secret|password|passkey|api[-_]?key|signature|sig)/i;
const SENSITIVE_QUERY =
  /([?&](?:sig|signature|token|key|secret|password|passkey|authorization)=)[^&#\s]*/gi;
const BEARER_TOKEN = /(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi;
const ADMIN_SESSION_COOKIE = /(yomirra_admin_session=)[^;\s]*/gi;
const LEGACY_ADMIN_KEY_COOKIE = /(yomirra_admin_key=)[^;\s]*/gi;

function redactString(value: string): string {
  return value
    .replace(SENSITIVE_QUERY, "$1[REDACTED]")
    .replace(BEARER_TOKEN, "$1[REDACTED]")
    .replace(ADMIN_SESSION_COOKIE, "$1[REDACTED]")
    .replace(LEGACY_ADMIN_KEY_COOKIE, "$1[REDACTED]");
}

function sanitizeForLog(
  value: unknown,
  keyHint?: string,
  seen: WeakSet<object> = new WeakSet(),
  depth = 0,
): unknown {
  if (keyHint && SENSITIVE_KEY.test(keyHint)) return "[REDACTED]";
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object") return value;
  if (depth >= 6) return "[TRUNCATED]";

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }

  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, undefined, seen, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      sanitizeForLog(nested, key, seen, depth + 1),
    ]),
  );
}

class Logger {
  private log(level: LogLevel, message: string, meta?: Record<string, unknown> | unknown) {
    if (env.NODE_ENV === "test" && level !== "error") return;

    const timestamp = new Date().toISOString();
    const isDev = env.NODE_ENV === "development";
    const safeMessage = redactString(message);
    const safeMeta = sanitizeForLog(meta);

    if (isDev) {
      const formattedMeta = safeMeta ? `\n${JSON.stringify(safeMeta, null, 2)}` : "";
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case "debug":
          console.debug(`\x1b[36m${prefix}\x1b[0m ${safeMessage}`, formattedMeta);
          break;
        case "info":
          console.info(`\x1b[32m${prefix}\x1b[0m ${safeMessage}`, formattedMeta);
          break;
        case "warn":
          console.warn(`\x1b[33m${prefix}\x1b[0m ${safeMessage}`, formattedMeta);
          break;
        case "error":
          console.error(`\x1b[31m${prefix}\x1b[0m ${safeMessage}`, formattedMeta);
          break;
      }
      return;
    }

    const logEntry = JSON.stringify({
      timestamp,
      level,
      message: safeMessage,
      ...(safeMeta && typeof safeMeta === "object" && !Array.isArray(safeMeta)
        ? safeMeta
        : { meta: safeMeta }),
    });
    console[level](logEntry);
  }

  debug(message: string, meta?: Record<string, unknown> | unknown) {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown> | unknown) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown> | unknown) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown> | unknown) {
    this.log("error", message, meta);
  }
}

export const logger = new Logger();
