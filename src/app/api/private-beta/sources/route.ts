export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyPrivateBetaOwner } from "@/server/lib/auth/admin-auth";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { privateBetaSources, privateBetaAllowsSource, readPrivateBetaCatalog, PRIVATE_BETA_MAX_PAGE, type PrivateBetaCatalogMode } from "@/server/lib/sources/private-beta";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "Vercel-CDN-Cache-Control": "no-store",
    "CDN-Cache-Control": "no-store",
    "Vary": "Authorization",
    "X-Robots-Tag": "noindex, nofollow",
  } });
}

export async function GET(req: NextRequest) {
  const limit = await checkRateLimit(req);
  if (!limit.success) return reply({ error: "Terlalu banyak permintaan." }, 429);
  if (!await verifyPrivateBetaOwner(req)) return reply({ error: "Tidak ditemukan." }, 404);

  const id = req.nextUrl.searchParams.get("source");
  if (!id) return reply({ data: privateBetaSources() });
  if (!privateBetaAllowsSource(id)) return reply({ error: "Sumber beta belum diizinkan." }, 403);
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length > 160) return reply({ error: "Kata kunci terlalu panjang." }, 400);
  const rawPage = req.nextUrl.searchParams.get("page") ?? "1";
  const rawMode = req.nextUrl.searchParams.get("mode") ?? (query ? "search" : "popular");
  if (!/^\d{1,2}$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > PRIVATE_BETA_MAX_PAGE ||
      !["popular", "latest", "search"].includes(rawMode) ||
      (rawMode === "search" ? !query : Boolean(query))) {
    return reply({ error: "Permintaan katalog tidak valid." }, 400);
  }
  try {
    return reply({ data: await readPrivateBetaCatalog(id, query, Number(rawPage), rawMode as PrivateBetaCatalogMode) });
  } catch {
    return reply({ error: "Pemeriksaan katalog belum berhasil. Tidak ada perubahan pada sumber publik." }, 503);
  }
}
