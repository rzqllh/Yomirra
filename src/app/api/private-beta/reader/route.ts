export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { verifyPrivateBetaOwner } from "@/server/lib/auth/admin-auth";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { readPrivateBetaDetail, readPrivateBetaChapter, fetchPrivateBetaPage, privateBetaAllowsSource, validBetaIdentity } from "@/server/lib/sources/private-beta";

function json(body: unknown, status = 200) {
  return NextResponse.json(body,{status,headers:{
    "Cache-Control":"private, no-store, max-age=0","Vercel-CDN-Cache-Control":"no-store",
    "CDN-Cache-Control":"no-store","Vary":"Authorization","X-Robots-Tag":"noindex, nofollow",
  }});
}
export async function POST(req: NextRequest) {
  const limit = await checkRateLimit(req);
  if (!limit.success) return json({error:"Terlalu banyak permintaan."},429);
  const uid = await verifyPrivateBetaOwner(req);
  if (!uid) return json({error:"Tidak ditemukan."},404);
  try {
    if (!req.body) return json({error:"Permintaan tidak valid."},400);
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let text = "";
    try {
      for (;;) {
        const {done,value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) { await reader.cancel(); return json({error:"Permintaan terlalu besar."},413); }
        text += decoder.decode(value,{stream:true});
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    let body;
    try { body = JSON.parse(text); } catch { return json({error:"Permintaan tidak valid."},400); }
    if (!body || typeof body !== "object") return json({error:"Permintaan tidak valid."},400);
    if (body.operation === "image") {
      if (typeof body.ticket !== "string") return json({error:"Permintaan tidak valid."},400);
      return await fetchPrivateBetaPage(body.ticket,uid,req.signal) ?? json({error:"Halaman tidak tersedia."},403);
    }
    if (typeof body.source !== "string" || !privateBetaAllowsSource(body.source)) return json({error:"Sumber tidak diizinkan."},403);
    if (!validBetaIdentity(body.mangaId)) return json({error:"Identitas tidak valid."},400);
    if (body.operation === "detail") return json({data:await readPrivateBetaDetail(body.source,body.mangaId)});
    if (body.operation === "chapter" && validBetaIdentity(body.chapterId)) return json({data:await readPrivateBetaChapter(uid,body.source,body.mangaId,body.chapterId)});
    return json({error:"Permintaan tidak valid."},400);
  } catch {
    return json({error:"Reader beta tidak dapat memuat data. Tidak ada perubahan pada sumber publik."},503);
  }
}
