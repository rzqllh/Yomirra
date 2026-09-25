import { z } from "zod";

// Server-side env vars — validated strictly at runtime, not at build time.
// Build time (next build) runs in a minimal environment where secrets
// may not be present yet (e.g. Vercel injects them at runtime).

const envSchema = z.object({
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  NEXT_PUBLIC_APP_URL: z.string().url().default(
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.yomirra.web.id"
  ),
  IMAGE_PROXY_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_ALLOWED_CHAT_IDS: z.string().optional(),
  OPS_CRON_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  VERCEL_DEPLOY_SECRET: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// During `next build`, page data collection imports server modules
// which triggers this file. If env vars are missing at build time,
// we warn instead of crashing — the real validation happens at runtime.
function getEnv(): Env {
  const parsed = envSchema.safeParse({
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    IMAGE_PROXY_SECRET: process.env.IMAGE_PROXY_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    TELEGRAM_ALLOWED_CHAT_IDS: process.env.TELEGRAM_ALLOWED_CHAT_IDS,
    OPS_CRON_SECRET: process.env.OPS_CRON_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    VERCEL_DEPLOY_SECRET: process.env.VERCEL_DEPLOY_SECRET,
  });

  if (parsed.success) {
    return parsed.data;
  }

  // At build time, missing env vars are expected — warn and return defaults
  // so the build can complete. Runtime requests will fail with clear errors.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (isBuildPhase) {
    console.warn(
      "⚠️  Missing environment variables during build (this is expected):",
      parsed.error.flatten().fieldErrors
    );
    // Return a stub so build can complete. Actual requests will fail
    // at the API route level with proper error handling.
    return {
      REDIS_URL: "redis://localhost:6379",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://www.yomirra.web.id",
      IMAGE_PROXY_SECRET: "build-placeholder-secret-not-used-at-runtime-32chars",
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "production",
      TELEGRAM_BOT_TOKEN: undefined,
      TELEGRAM_CHAT_ID: undefined,
      TELEGRAM_ALLOWED_CHAT_IDS: undefined,
      OPS_CRON_SECRET: undefined,
      CRON_SECRET: undefined,
      TELEGRAM_WEBHOOK_SECRET: undefined,
      VERCEL_DEPLOY_SECRET: undefined,
    };
  }

  // At runtime, missing env vars are a hard error.
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = getEnv();
