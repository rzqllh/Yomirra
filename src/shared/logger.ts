import { env } from "@/env";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private log(level: LogLevel, message: string, meta?: Record<string, unknown> | unknown) {
    if (env.NODE_ENV === "test" && level !== "error") return;

    const timestamp = new Date().toISOString();
    const isDev = env.NODE_ENV === "development";

    if (isDev) {
      let safeMeta = meta;
      if (meta && typeof meta === 'object') {
        safeMeta = Object.fromEntries(
          Object.entries(meta).map(([key, value]) => {
            if (value instanceof Error) {
              return [key, { message: value.message, name: value.name, stack: value.stack }];
            }
            return [key, value];
          })
        );
      }
      const formattedMeta = safeMeta ? `\n${JSON.stringify(safeMeta, null, 2)}` : "";
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case "debug":
          console.debug(`\x1b[36m${prefix}\x1b[0m ${message}`, formattedMeta);
          break;
        case "info":
          console.info(`\x1b[32m${prefix}\x1b[0m ${message}`, formattedMeta);
          break;
        case "warn":
          console.warn(`\x1b[33m${prefix}\x1b[0m ${message}`, formattedMeta);
          break;
        case "error":
          console.error(`\x1b[31m${prefix}\x1b[0m ${message}`, formattedMeta);
          break;
      }
    } else {
      // Production: structured JSON logging
      const logEntry = JSON.stringify({
        timestamp,
        level,
        message,
        ...(typeof meta === "object" && meta !== null ? meta : { meta }),
      });
      console[level](logEntry);
    }
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
