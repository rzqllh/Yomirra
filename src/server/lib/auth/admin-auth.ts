import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { logger } from "@/shared/logger";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "yomirra_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AdminAuthResult {
  isAdmin: boolean;
  uid: string;
  email?: string;
  method?: "api_key" | "firebase" | "session";
  error?: "unconfigured" | "missing_token" | "invalid_token" | "not_admin" | "csrf_rejected";
}

interface AdminSessionPayload {
  v: 1;
  sub: string;
  email?: string;
  iat: number;
  exp: number;
}

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;

export function isFirebaseAdminConfigured(): boolean {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

async function getAdminAuth() {
  if (adminAuthInstance) return adminAuthInstance;
  if (!isFirebaseAdminConfigured()) return null;

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!.trim();
    const serviceAccount = JSON.parse(rawKey);

    if (getApps().length > 0) {
      adminAppInstance = getApps()[0];
    } else {
      adminAppInstance = initializeApp({
        credential: cert(serviceAccount),
      });
    }

    adminAuthInstance = getAuth(adminAppInstance);
    return adminAuthInstance;
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK", { error });
    return null;
  }
}

function parseAdminEmails(envVar?: string): Set<string> {
  if (!envVar) return new Set();
  return new Set(
    envVar
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getValidAdminKeys(): string[] {
  return [process.env.ADMIN_KEY, process.env.ADMIN_SECRET]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

export function isAdminAuthConfigured(): boolean {
  return getValidAdminKeys().length > 0 || isFirebaseAdminConfigured();
}

function getAdminSessionSigningKey(): string | null {
  const key =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_KEY?.trim();

  return key || null;
}

function encodePayload(payload: AdminSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function signaturesEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionToken(
  subject: string,
  email?: string,
  maxAgeSeconds: number = ADMIN_SESSION_TTL_SECONDS,
): string | null {
  const secret = getAdminSessionSigningKey();
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    v: 1,
    sub: subject,
    ...(email ? { email } : {}),
    iat: now,
    exp: now + maxAgeSeconds,
  };
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(token: string): AdminAuthResult {
  const secret = getAdminSessionSigningKey();
  if (!secret) {
    return { isAdmin: false, uid: "", error: "unconfigured" };
  }

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) {
    return { isAdmin: false, uid: "", error: "invalid_token" };
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!signaturesEqual(signature, expectedSignature)) {
    return { isAdmin: false, uid: "", error: "invalid_token" };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.v !== 1 ||
      !payload.sub ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now
    ) {
      return { isAdmin: false, uid: "", error: "invalid_token" };
    }

    return {
      isAdmin: true,
      uid: payload.sub,
      email: payload.email,
      method: "session",
    };
  } catch {
    return { isAdmin: false, uid: "", error: "invalid_token" };
  }
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function isSafeSessionMutation(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

function authorizeConfiguredAdminKey(token: string): AdminAuthResult | null {
  if (!token || !getValidAdminKeys().includes(token.trim())) return null;
  return {
    isAdmin: true,
    uid: "admin-key",
    method: "api_key",
  };
}

export async function verifyAdminRequest(req: Request): Promise<AdminAuthResult> {
  try {
    if (!isAdminAuthConfigured()) {
      return {
        isAdmin: false,
        uid: "",
        error: "unconfigured",
      };
    }

    const directKey = req.headers.get("x-admin-key");
    const directResult = directKey ? authorizeConfiguredAdminKey(directKey) : null;
    if (directResult) return directResult;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const keyResult = authorizeConfiguredAdminKey(token);
      if (keyResult) return keyResult;

      if (token && isFirebaseAdminConfigured()) {
        const auth = await getAdminAuth();
        if (auth) {
          try {
            const decoded = await auth.verifyIdToken(token);
            const uid = typeof decoded.uid === "string" ? decoded.uid : "";
            const email =
              typeof decoded.email === "string"
                ? decoded.email.toLowerCase()
                : undefined;
            const hasAdminClaim = decoded.admin === true;
            const allowedEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
            const isAllowedEmail = email ? allowedEmails.has(email) : false;

            if (uid && (hasAdminClaim || isAllowedEmail)) {
              return {
                isAdmin: true,
                uid,
                email,
                method: "firebase",
              };
            }

            return {
              isAdmin: false,
              uid,
              email,
              error: "not_admin",
            };
          } catch (tokenErr) {
            logger.warn("Admin verifyIdToken failed", {
              error:
                tokenErr instanceof Error
                  ? tokenErr.message
                  : "token verification failed",
            });
          }
        }
      }
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const sessionToken = getCookieValue(cookieHeader, ADMIN_SESSION_COOKIE);
    if (sessionToken) {
      const sessionResult = verifyAdminSessionToken(sessionToken);
      if (!sessionResult.isAdmin) return sessionResult;
      if (!isSafeSessionMutation(req)) {
        return {
          isAdmin: false,
          uid: "",
          error: "csrf_rejected",
        };
      }
      return sessionResult;
    }

    return {
      isAdmin: false,
      uid: "",
      error: "invalid_token",
    };
  } catch (error) {
    logger.error("verifyAdminRequest failed", {
      error: error instanceof Error ? error.message : "unknown auth error",
    });
    return {
      isAdmin: false,
      uid: "",
      error: "invalid_token",
    };
  }
}

export type AdminAuthGuard =
  | { authorized: true; admin: AdminAuthResult }
  | { authorized: false; response: NextResponse };

export async function requireAdminAuth(req: Request): Promise<AdminAuthGuard> {
  try {
    const result = await verifyAdminRequest(req);
    if (!result.isAdmin) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error:
              result.error === "unconfigured"
                ? "Admin authentication is not configured"
                : "Unauthorized",
            code: result.error || "unauthorized",
          },
          { status: result.error === "unconfigured" ? 503 : 401 },
        ),
      };
    }

    return {
      authorized: true,
      admin: result,
    };
  } catch (error) {
    logger.error("requireAdminAuth unexpected error", {
      error: error instanceof Error ? error.message : "unknown auth error",
    });
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal authorization error" },
        { status: 500 },
      ),
    };
  }
}
