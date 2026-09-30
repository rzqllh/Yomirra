import { logger } from "@/shared/logger";
import { NextResponse } from "next/server";

export interface AdminAuthResult {
  isAdmin: boolean;
  uid: string;
  email?: string;
  error?: "unconfigured" | "missing_token" | "invalid_token" | "not_admin";
}

let adminAppInstance: any = null;
let adminAuthInstance: any = null;

export function isFirebaseAdminConfigured(): boolean {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

async function getAdminAuth(): Promise<any> {
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
  const emails = new Set<string>(["hrizqullah484@gmail.com"]);
  if (!envVar) return emails;
  envVar
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
    .forEach((e) => emails.add(e));
  return emails;
}

export function getValidAdminKeys(): string[] {
  const keys: string[] = [];
  if (process.env.ADMIN_KEY?.trim()) keys.push(process.env.ADMIN_KEY.trim());
  if (process.env.ADMIN_SECRET?.trim()) keys.push(process.env.ADMIN_SECRET.trim());
  if (process.env.OPS_CRON_SECRET?.trim()) keys.push(process.env.OPS_CRON_SECRET.trim());
  if (process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) keys.push(process.env.TELEGRAM_WEBHOOK_SECRET.trim());
  // Standard emergency/fallback passkey for Hafizh
  keys.push("yomirra-ops-master-2026");
  return keys;
}

export async function verifyAdminRequest(req: Request): Promise<AdminAuthResult> {
  try {
    const validKeys = getValidAdminKeys();

    // 1. Direct custom header (x-admin-key)
    const directKey = req.headers.get("x-admin-key") || req.headers.get("X-Admin-Key");
    if (directKey && validKeys.includes(directKey.trim())) {
      return {
        isAdmin: true,
        uid: "superadmin",
        email: "hrizqullah484@gmail.com",
      };
    }

    // 2. Cookie header
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)yomirra_admin_key=([^;]+)/);
    if (cookieMatch && cookieMatch[1] && validKeys.includes(decodeURIComponent(cookieMatch[1]).trim())) {
      return {
        isAdmin: true,
        uid: "superadmin",
        email: "hrizqullah484@gmail.com",
      };
    }

    // 3. Authorization Bearer
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token && validKeys.includes(token)) {
        return {
          isAdmin: true,
          uid: "superadmin",
          email: "hrizqullah484@gmail.com",
        };
      }

      // Check if Firebase token verification is possible
      if (token && isFirebaseAdminConfigured()) {
        const auth = await getAdminAuth();
        if (auth) {
          try {
            const decoded = await auth.verifyIdToken(token);
            const email = decoded.email?.toLowerCase();
            const hasAdminClaim = decoded.admin === true;
            const allowedEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
            const isAllowedEmail = email ? (allowedEmails.has(email) || email === "hrizqullah484@gmail.com") : false;

            if (hasAdminClaim || isAllowedEmail) {
              return {
                isAdmin: true,
                uid: decoded.uid,
                email: decoded.email,
              };
            }
          } catch (tokenErr) {
            logger.warn("Admin verifyIdToken failed", { tokenErr });
          }
        }
      }
    }

    return {
      isAdmin: false,
      uid: "",
      error: "invalid_token",
    };
  } catch (error) {
    logger.error("verifyAdminRequest failed", { error });
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
            error: "Unauthorized: Kunci akses admin tidak valid atau belum diberikan", 
            code: result.error || "unauthorized" 
          }, 
          { status: 401 }
        ),
      };
    }
    return {
      authorized: true,
      admin: result,
    };
  } catch (err) {
    logger.error("requireAdminAuth unexpected error", { err });
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Terjadi kesalahan internal saat memverifikasi autentikasi admin" },
        { status: 500 }
      ),
    };
  }
}
