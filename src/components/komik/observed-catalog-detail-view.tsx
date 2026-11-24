"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/shared/api-client";
import { canonicalSourceKey, type CanonicalSourceIdentity } from "@/shared/lib/canonical-identity";
import { inspectObservedCatalog, type ObservedCatalogDetail } from "@/shared/lib/observed-catalog";
import { sourceReadScope } from "@/shared/sources/content-policy";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { resolveCanonicalResume } from "@/shared/lib/canonical-resume";
import { rankQualityRefs } from "@/shared/lib/source-quality";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";

import { MangaCover } from "./manga-cover";
import { Button } from "@/components/ui/button";

export function ObservedCatalogDetailView({refs,returnTo}:{refs:CanonicalSourceIdentity[];returnTo:string}) {
  const router=useRouter();
  const scope=useSettingsStore(sourceReadScope);
  const preferences=useSettingsStore(s=>s.perTitleSourcePreferences);
  const qualityEvidence=useSourceQualityStore(s=>s.evidence);
  const languages=useSettingsStore(s=>s.preferredLanguages);
  const history=useHistoryStore(s=>s.items);
  const disabled=useSourcePreferencesStore(s=>s.disabledSources);
  const [showPicker,setShowPicker]=useState(false);
  const available=refs.filter(ref=>{
    const meta=getSourceMetadata(ref.sourceId);
    return Boolean(meta && !meta.isDynamic && !meta.isNsfw &&
      isDiscoverySourceSystemEligible(meta) && meta.capabilities.detail && !disabled.includes(ref.sourceId));
  });
  const query=useQuery({
    queryKey:["catalog-observed-detail",available,scope],
    enabled:available.length>0,
    queryFn:async({signal})=>{
      // Only on explicit navigation, at most four public detail requests.
      // The source API remains the content/auth authority.
      const results=await Promise.allSettled(available.map(async ref=>({
        ...ref,detail:await apiClient.getDetail(ref.sourceId,ref.mangaId,{signal}),
      })));
      return results.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
    },
    retry:false,staleTime:5*60*1000,refetchOnWindowFocus:false,refetchOnReconnect:false,
  });
  const result=inspectObservedCatalog(refs,(query.data??[]) as ObservedCatalogDetail[]);
  const primary=result.visible[0];
  const refKeys=new Set(refs.map(ref=>canonicalSourceKey(ref.sourceId,ref.mangaId)));
  const lastRead=Object.values(history).filter(item=>refKeys.has(canonicalSourceKey(item.sourceId,item.mangaId)))
    .map(item=>({sourceId:item.sourceId,mangaId:item.mangaId,chapterId:item.chapterId,
      readAt:typeof item.readAt==="number"?item.readAt:Date.parse(String(item.readAt))||0}));
  const existingChoices=new Set(refs.map(ref=>preferences[ref.sourceId+"::"+ref.mangaId]).filter(Boolean));
  const preferred=existingChoices.size===1?[...existingChoices][0]:undefined;
  const decision=result.verified && existingChoices.size<2 ? resolveCanonicalResume({
    bindings:refs,preferredSourceId:preferred,lastRead,
    disabledSourceIds:disabled,
    unavailableSourceIds:refs.filter(ref=>!result.visible.some(row=>row.sourceId===ref.sourceId && row.mangaId===ref.mangaId)).map(ref=>ref.sourceId),
  }):null;
  const resume=()=>{
    if(decision?.action==="resume"){
      const ref=decision.source;
      router.push(decision.chapterId?getReaderHref(ref.sourceId,ref.mangaId,decision.chapterId,returnTo):getMangaDetailHref(ref.sourceId,ref.mangaId,returnTo));
    }else setShowPicker(true);
  };
  return <main className="mx-auto max-w-4xl px-4 py-6 pb-28 space-y-6">
    <Link href={returnTo} className="text-sm text-accent underline">Kembali</Link>
    {query.isFetching && !query.data ? <p role="status" className="text-sm text-text-secondary">Memeriksa detail sumber…</p> :
    !primary ? <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <h1 className="text-xl font-bold">Katalog belum tersedia</h1>
      <p className="text-sm text-text-secondary">Belum ada detail aman yang dapat diverifikasi. Pilihan sumber dan riwayat tetap disimpan.</p>
      {available.length>0 && <Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button>}
    </section> :
    <>
      <section className="flex flex-col sm:flex-row gap-5 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:p-5">
        <div className="w-32 sm:w-40 shrink-0 aspect-[2/3] overflow-hidden rounded-lg">
          <MangaCover src={primary.detail.coverUrl} sourceId={primary.sourceId} mangaId={primary.mangaId} alt={primary.detail.title} fallbackTitle={primary.detail.title} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{primary.detail.title}</h1>
          {primary.detail.author && <p className="text-sm text-text-secondary">{primary.detail.author}</p>}
          <p className="text-sm text-text-secondary">{primary.detail.description || "Sinopsis belum tersedia."}</p>
          <p role="status" className="text-xs text-text-muted">{result.verified ?
            "Identitas eksternal sumber cocok. Posisi membaca tetap terpisah." :
            "Identitas semua sumber belum terverifikasi. Setiap detail ditampilkan terpisah; tidak ada penggabungan permanen."}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={resume}>Lanjut baca</Button>
            <Button variant="outline" onClick={()=>setShowPicker(true)}>Pilih sumber</Button>
          </div>
        </div>
      </section>
      <section aria-label="Sumber katalog" className="space-y-3">
        <h2 className="text-lg font-bold">Sumber bacaan</h2>
        {showPicker && <p role="status" className="text-sm text-text-secondary">Pilih sumber untuk membaca. Pilihan ini tidak mengganti sumber utama.</p>}
        {rankQualityRefs(result.visible.map(row=>({...row,language:row.detail.language??getSourceMetadata(row.sourceId)?.language})),qualityEvidence,{preferred,languages,verifiedGroup:result.verified}).map(({ref:row,quality,scope})=><Link key={canonicalSourceKey(row.sourceId,row.mangaId)} prefetch={false} href={getMangaDetailHref(row.sourceId,row.mangaId,returnTo)}
          className="block rounded-lg border border-border-subtle p-3 text-text-primary hover:bg-surface-hover">
          {getSourceMetadata(row.sourceId)?.name??row.sourceId}
          <span className="block text-sm text-text-secondary">{row.detail.title}</span>
          <span className="block text-xs text-text-muted">{quality.score===null?"SQS: Belum cukup data":`SQS ${quality.score}/100 · bukti ${quality.coverage}% · ${scope==="title"?"judul":"sumber"}`}</span>
        </Link>)}
        {result.visible.length<refs.length && <p className="text-xs text-text-muted">Sebagian sumber belum dapat diverifikasi atau dinonaktifkan.</p>}
      </section>
    </>}
  </main>;
}
