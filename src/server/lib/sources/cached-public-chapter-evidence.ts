import { chapterQualityEvidence,type QualityChapters } from "@/shared/lib/source-quality";
import { classifyContent } from "@/shared/sources/content-policy";
import type {Chapter,MangaItem} from "@/shared/sources/source-types";

const MAX_ENTRY_BYTES=512*1024;
function freshEntry(raw:string|null,ttl:number,now:number):{data:unknown;at:number}|undefined{
  if(!raw||raw.length>MAX_ENTRY_BYTES)return;
  try{
    const entry=JSON.parse(raw);
    const at=entry.expiresAt-ttl*1000;
    if(!Number.isFinite(entry.expiresAt)||entry.expiresAt<=now||!Number.isFinite(at)||at<=0||at>now)return;
    return {data:entry.data,at};
  }catch{return;}
}
/** Public safe-mode cache only. No raw title, image URL, chapter ID or
 * reader-specific evidence is returned. Never fetch missing upstream data. */
export function cachedPublicChapterEvidence(mangaId:string,detailRaw:string|null,chapterRaw:string|null,now:number,detailTtl:number,chapterTtl:number):QualityChapters|undefined{
  const detail=freshEntry(detailRaw,detailTtl,now);
  const chapters=freshEntry(chapterRaw,chapterTtl,now);
  if(!detail||!chapters||!detail.data||typeof detail.data!=="object"||
     (detail.data as MangaItem).id!==mangaId||classifyContent(detail.data as MangaItem)!=="SAFE"||
     !Array.isArray(chapters.data))return;
  const evidence=chapterQualityEvidence(chapters.data as Chapter[],mangaId,chapters.at);
  // Return only bounded public chapter numbering. Do not infer anything
  // from empty, oversized or unclassified cache entries.
  if(!evidence||evidence.labels.some(label=>label.length>100))return;
  return evidence;
}
