import { z } from "zod";

// Server-side env vars — validated strictly at runtime, not at build time.
// Build time (next build) runs in a minimal environment where secrets
// may not be present yet (e.g. Vercel injects them at runtime).

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  IMAGE_PROXY_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

type Env = z.infer<typeof envSchema>;

// During `next build`, page data collection imports server modules
// which triggers this file. If env vars are missing at build time,
// we warn instead of crashing — the real validation happens at runtime.
function getEnv(): Env {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    IMAGE_PROXY_SECRET: process.env.IMAGE_PROXY_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
      DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      REDIS_URL: "redis://localhost:6379",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      IMAGE_PROXY_SECRET: "build-placeholder-secret-not-used-at-runtime-32chars",
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "production",
      CLOUDINARY_CLOUD_NAME: "build",
      CLOUDINARY_API_KEY: "build",
      CLOUDINARY_API_SECRET: "build",
      NEXT_PUBLIC_SUPABASE_URL: "https://build.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "build",
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
