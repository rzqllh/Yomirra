import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { logger } from "@/shared/logger";

export interface AdminAuthResult {
  isAdmin: boolean;
  uid: string;
  email?: string;
  error?: "unconfigured" | "missing_token" | "invalid_token" | "not_admin";
}

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;

export function isFirebaseAdminConfigured(): boolean {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

function getAdminAuth(): Auth | null {
  if (adminAuthInstance) return adminAuthInstance;
  if (!isFirebaseAdminConfigured()) return null;

  try {
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
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
}

export async function verifyAdminRequest(req: Request): Promise<AdminAuthResult> {
  const auth = getAdminAuth();
  if (!auth) {
    return { isAdmin: false, uid: "", error: "unconfigured" };
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAdmin: false, uid: "", error: "missing_token" };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { isAdmin: false, uid: "", error: "missing_token" };
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email?.toLowerCase();
    const hasAdminClaim = decoded.admin === true;
    const allowedEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
    const isAllowedEmail = email ? allowedEmails.has(email) : false;

    if (hasAdminClaim || isAllowedEmail) {
      return {
        isAdmin: true,
        uid: decoded.uid,
        email: decoded.email,
      };
    }

    return {
      isAdmin: false,
      uid: decoded.uid,
      email: decoded.email,
      error: "not_admin",
    };
  } catch (err) {
    logger.warn("Admin verifyIdToken failed", { err });
    return {
      isAdmin: false,
      uid: "",
      error: "invalid_token",
    };
  }
}

import { NextResponse } from "next/server";

export type AdminAuthGuard =
  | { authorized: true; admin: AdminAuthResult }
  | { authorized: false; response: NextResponse };

export async function requireAdminAuth(req: Request): Promise<AdminAuthGuard> {
  const result = await verifyAdminRequest(req);
  if (!result.isAdmin) {
    const status = result.error === "unconfigured" ? 503 : result.error === "not_admin" ? 403 : 401;
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized", code: result.error }, { status }),
    };
  }
  return {
    authorized: true,
    admin: result,
  };
}
