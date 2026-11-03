import type { MalPopularFeed, MalPopularWork } from "@/shared/types/mal";
import { withCache } from "@/server/lib/cache/redis-cache";

type Entry = { node?: { id?: number; title?: string; main_picture?: { large?: string; medium?: string }; nsfw?: string | null; num_list_users?: number; media_type?: string }; ranking?: { rank?: number } };
export function normalizeMalRanking(entries: Entry[], safeOnly: boolean): MalPopularWork[] {
  const seen = new Set<number>();
  return entries.flatMap<MalPopularWork>(({ node, ranking }) => {
    if (!node || !Number.isSafeInteger(node.id) || node.id! <= 0 || !node.title?.trim() || !Number.isSafeInteger(ranking?.rank) || ranking!.rank! <= 0 || seen.has(node.id!)) return [];
    // MAL defines white as safe; missing/gray/black classification stays hidden by default.
    if (safeOnly && node.nsfw !== "white") return [];
    if (["novel", "light_novel"].includes(node.media_type ?? "")) return [];
    seen.add(node.id!);
    let coverUrl = "";
    try {
      const url = new URL(node.main_picture?.large ?? node.main_picture?.medium ?? "");
      if (url.protocol === "https:" && ["cdn.myanimelist.net", "myanimelist.cdn-dena.com"].includes(url.hostname)) coverUrl = url.href;
    } catch { /* A missing cover must not discard verified metadata. */ }
    return [{ malId: node.id!, title: node.title.trim(), coverUrl, rank: ranking!.rank!, members: Number.isSafeInteger(node.num_list_users) && node.num_list_users! >= 0 ? node.num_list_users! : null, mediaType: node.media_type ?? "unknown", nsfw: node.nsfw === "white" || node.nsfw === "gray" || node.nsfw === "black" ? node.nsfw : null }];
  }).sort((a, b) => a.rank - b.rank).slice(0, 30);
}

export async function getMalPopular(safeOnly = true): Promise<MalPopularFeed> {
  const clientId = process.env.MAL_CLIENT_ID?.trim();
  if (!clientId) return { status: "unconfigured", works: [], message: "Populer MAL belum dikonfigurasi. Peringkat sumber bacaan tetap tersedia." };
  try {
    return await withCache(`metadata:mal:popular:v1:${safeOnly ? "safe" : "opt-in"}`, async () => {
      const params = new URLSearchParams({ ranking_type: "bypopularity", limit: "100", fields: "nsfw,num_list_users,media_type" });
      const response = await fetch(`https://api.myanimelist.net/v2/manga/ranking?${params}`, {
        headers: { "X-MAL-CLIENT-ID": clientId, Accept: "application/json" }, redirect: "error",
        signal: AbortSignal.timeout(8000), next: { revalidate: 3600 },
      });
      if (!response.ok) throw new Error(`MAL_HTTP_${response.status}`);
      const payload = await response.json() as { data?: Entry[] };
      if (!Array.isArray(payload.data)) throw new Error("MAL_INVALID_RESPONSE");
      const date = response.headers.get("date");
      return { status: "ready" as const, works: normalizeMalRanking(payload.data, safeOnly), safeOnly, fetchedAt: date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : new Date().toISOString() };
    }, 3600, { allowStaleOnError: false });
  } catch {
    return { status: "unavailable", works: [], message: "Peringkat MAL belum dapat dijangkau. Coba lagi nanti atau gunakan peringkat sumber bacaan." };
  }
}
